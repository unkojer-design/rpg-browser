import Phaser from "phaser";
import { WILD_ENCOUNTERS, SPECIES, createPokemon } from "./PokemonData";

const TILE = 32;
const MAP_W = 60;
const MAP_H = 50;
const PLAYER_SPEED = 150;

// Couleurs de la map
const COL_GRASS      = 0x4aaa4a;
const COL_GRASS2     = 0x3e9e3e;
const COL_DARK       = 0x1a6b1a;
const COL_DARK2      = 0x155515;
const COL_PATH       = 0xd4b87a;
const COL_PATH2      = 0xc4a060;
const COL_WATER      = 0x2255cc;
const COL_WATER2     = 0x3366dd;
const COL_TREE       = 0x155515;
const COL_TREE2      = 0x0d3d0d;
const COL_SAND       = 0xeedd99;
const COL_SAND2      = 0xddcc88;

export class PokemonScene extends Phaser.Scene {
  constructor() {
    super({ key: "PokemonScene" });
    this.players = new Map();
    this.socket = null;
    this.trainerData = null;
    this.existingPlayers = [];
    this.onWildEncounter = null;
    this.onHeal = null;
    this.chatCallback = null;
    this._inBattle = false;
    this._stepsSinceLastFight = 0;
    this._nearPokecenter = false;
    this.saveTimer = 0;
    this.lastSavedPos = { x: 0, y: 0 };
    this.grassTiles = [];
    this.waterTiles = [];
  }

  init() {}

  create() {
    this._buildMap();
    this._createSelfPlayer();
    // Charger les joueurs déjà connectés
    (this.existingPlayers || []).forEach((p) => this._addRemotePlayer(p));
    this._setupRemotePlayers();
    this._setupCamera();
    this._setupInput();
    this._setupSocketHandlers();
    this._createUI();
  }

  _buildMap() {
    const gfx = this.add.graphics();
    this.grassTiles = [];
    this.waterTiles = [];
    this._waterGfx = this.add.graphics();
    this._waterTime = 0;

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = this._getTileType(x, y);
        const checker = (x + y) % 2 === 0;
        const px = x * TILE, py = y * TILE;

        if (tile === "water") {
          gfx.fillStyle(COL_WATER, 1);
          gfx.fillRect(px, py, TILE, TILE);
          this.waterTiles.push({ x: px + TILE / 2, y: py + TILE / 2 });
        } else if (tile === "tree") {
          gfx.fillStyle(checker ? COL_TREE : COL_TREE2, 1);
          gfx.fillRect(px, py, TILE, TILE);
          // Tronc
          gfx.fillStyle(0x7a5c2e, 1);
          gfx.fillRect(px + 12, py + 20, 8, 12);
          // Feuillage (3 couches)
          gfx.fillStyle(0x1a7a1a, 1);
          gfx.fillTriangle(px + 16, py + 2, px + 4, py + 22, px + 28, py + 22);
          gfx.fillStyle(0x228822, 1);
          gfx.fillTriangle(px + 16, py + 6, px + 5, py + 24, px + 27, py + 24);
          gfx.fillStyle(0x2a992a, 1);
          gfx.fillTriangle(px + 16, py + 10, px + 7, py + 26, px + 25, py + 26);
        } else if (tile === "path") {
          gfx.fillStyle(checker ? COL_PATH : COL_PATH2, 1);
          gfx.fillRect(px, py, TILE, TILE);
          // Petits cailloux
          gfx.fillStyle(0xb89050, 0.6);
          gfx.fillCircle(px + 8, py + 8, 2);
          gfx.fillCircle(px + 22, py + 18, 2);
          gfx.fillCircle(px + 14, py + 24, 1.5);
        } else if (tile === "tallgrass") {
          gfx.fillStyle(checker ? COL_DARK : COL_DARK2, 1);
          gfx.fillRect(px, py, TILE, TILE);
          this.grassTiles.push({ x: px + TILE / 2, y: py + TILE / 2 });
          // Brins d'herbe variés
          gfx.fillStyle(0x33aa33, 1);
          gfx.fillRect(px + 4,  py + 16, 3, 13);
          gfx.fillRect(px + 11, py + 12, 3, 17);
          gfx.fillRect(px + 18, py + 15, 3, 14);
          gfx.fillRect(px + 25, py + 11, 3, 18);
          gfx.fillStyle(0x44cc44, 1);
          gfx.fillRect(px + 7,  py + 14, 2, 10);
          gfx.fillRect(px + 22, py + 13, 2, 11);
          // Petite fleur
          if (checker) {
            gfx.fillStyle(0xffff44, 1);
            gfx.fillCircle(px + 14, py + 10, 2.5);
          }
        } else if (tile === "sand") {
          gfx.fillStyle(checker ? COL_SAND : COL_SAND2, 1);
          gfx.fillRect(px, py, TILE, TILE);
          // Texture sable
          gfx.fillStyle(0xccbb77, 0.5);
          gfx.fillCircle(px + 10, py + 10, 2);
          gfx.fillCircle(px + 22, py + 20, 1.5);
        } else {
          gfx.fillStyle(checker ? COL_GRASS : COL_GRASS2, 1);
          gfx.fillRect(px, py, TILE, TILE);
          // Petites fleurs aléatoires sur l'herbe
          if ((x * 7 + y * 13) % 11 === 0) {
            gfx.fillStyle(0xffffff, 0.7);
            gfx.fillCircle(px + 16, py + 16, 2);
          } else if ((x * 3 + y * 5) % 17 === 0) {
            gfx.fillStyle(0xffaaff, 0.7);
            gfx.fillCircle(px + 10, py + 20, 2);
          }
        }
      }
    }

    // Murs physiques : uniquement les 4 bords de la map
    this.walls = this.physics.add.staticGroup();
    const W = MAP_W * TILE;
    const H = MAP_H * TILE;
    const thickness = TILE;
    const borders = [
      { x: W / 2,         y: thickness / 2, w: W,         h: thickness }, // haut
      { x: W / 2,         y: H - thickness / 2, w: W,     h: thickness }, // bas
      { x: thickness / 2, y: H / 2,         w: thickness, h: H         }, // gauche
      { x: W - thickness / 2, y: H / 2,     w: thickness, h: H         }, // droite
    ];
    borders.forEach(({ x, y, w, h }) => {
      const wb = this.physics.add.staticImage(x, y);
      wb.setVisible(false);
      wb.setDisplaySize(w, h);
      wb.refreshBody();
      this.walls.add(wb);
    });

    this.mapWidth  = MAP_W * TILE;
    this.mapHeight = MAP_H * TILE;

    // Ville au centre bas : bâtiments
    this._drawBuildings(gfx);

    // NPC décoratifs
    this._drawNPCs(gfx);
  }

  _getTileType(x, y) {
    // Bordures
    if (x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1) return "tree";

    // Chemin principal vertical (centre)
    if (x >= 27 && x <= 33 && y >= 2 && y <= 48) return "path";

    // Chemin horizontal (milieu map)
    if (y >= 24 && y <= 27 && x >= 2 && x <= 58) return "path";

    // Chemin horizontal (bas, vers ville)
    if (y >= 38 && y <= 40 && x >= 20 && x <= 45) return "path";

    // Centre ville
    if (x >= 20 && x <= 44 && y >= 40 && y <= 48) return "path";

    // Lac (nord-est)
    if (x >= 44 && x <= 54 && y >= 6 && y <= 16) return "water";

    // Sable autour du lac
    if (x >= 42 && x <= 56 && y >= 4 && y <= 18 &&
        !(x >= 44 && x <= 54 && y >= 6 && y <= 16)) return "sand";

    // Forêt dense nord-ouest (petit bloc)
    if (x >= 2 && x <= 12 && y >= 2 && y <= 10) return "tree";

    // Forêt dense nord (bande fine)
    if (x >= 2 && x <= 26 && y >= 2 && y <= 4) return "tree";
    if (x >= 34 && x <= 42 && y >= 2 && y <= 4) return "tree";

    // Herbes hautes zone 1 (nord-ouest, accessible depuis chemin)
    if (x >= 13 && x <= 26 && y >= 5 && y <= 23) return "tallgrass";

    // Herbes hautes zone 2 (nord-est, entre chemin et lac)
    if (x >= 34 && x <= 41 && y >= 5 && y <= 23) return "tallgrass";

    // Herbes hautes zone 3 (sud-est)
    if (x >= 34 && x <= 58 && y >= 28 && y <= 37) return "tallgrass";

    // Herbes hautes zone 4 (sud-ouest)
    if (x >= 2 && x <= 26 && y >= 28 && y <= 37) return "tallgrass";

    return "grass";
  }

  _drawBuilding(gfx, bx, by, bw, bh, wallColor, roofColor) {
    const T = TILE;
    // Ombre portée
    gfx.fillStyle(0x000000, 0.18);
    gfx.fillRect(bx * T + 4, by * T + 4, bw * T, bh * T);
    // Murs
    gfx.fillStyle(wallColor, 1);
    gfx.fillRect(bx * T, by * T, bw * T, bh * T);
    // Bord bas (socle)
    gfx.fillStyle(0x000000, 0.15);
    gfx.fillRect(bx * T, (by + bh) * T - 4, bw * T, 4);
    // Toit
    gfx.fillStyle(roofColor, 1);
    gfx.fillTriangle(bx * T - 4, by * T, (bx + bw / 2) * T, (by - 1.2) * T, (bx + bw + 0.12) * T, by * T);
    // Contour toit
    gfx.lineStyle(2, 0x000000, 0.3);
    gfx.strokeTriangle(bx * T - 4, by * T, (bx + bw / 2) * T, (by - 1.2) * T, (bx + bw + 0.12) * T, by * T);
  }

  _drawBuildings(gfx) {
    const T = TILE;
    // ── Centre Pokémon ──
    this._drawBuilding(gfx, 22, 35, 5, 3, 0xee3333, 0xbb1111);
    // Croix médicale
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(24 * T + 9, 36 * T + 4, 6, 14);
    gfx.fillRect(24 * T + 4, 36 * T + 8, 16, 6);
    // Fenêtres
    gfx.fillStyle(0x88ccff, 1);
    gfx.fillRect(22 * T + 4, 36 * T + 4, T - 6, T - 6);
    gfx.fillRect(26 * T + 4, 36 * T + 4, T - 6, T - 6);
    // Porte
    gfx.fillStyle(0x884422, 1);
    gfx.fillRect(23 * T + 10, 37 * T + 8, 12, 16);
    gfx.fillStyle(0xffdd44, 1);
    gfx.fillCircle(23 * T + 19, 37 * T + 16, 2);

    // ── Shop / Poké Mart ──
    this._drawBuilding(gfx, 29, 35, 5, 3, 0x2244cc, 0x112299);
    // Vitrine
    gfx.fillStyle(0xaaddff, 1);
    gfx.fillRect(30 * T + 2, 36 * T + 2, 3 * T - 4, T - 4);
    gfx.lineStyle(2, 0x6699cc, 1);
    gfx.strokeRect(30 * T + 2, 36 * T + 2, 3 * T - 4, T - 4);
    // Porte
    gfx.fillStyle(0x884422, 1);
    gfx.fillRect(31 * T + 8, 37 * T + 8, 12, 16);
    // Signe Poké Ball
    gfx.fillStyle(0xff2222, 1);
    gfx.fillCircle(31 * T + 14, 35 * T + 14, 7);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(31 * T + 7, 35 * T + 13, 14, 3);
    gfx.fillCircle(31 * T + 14, 35 * T + 14, 3);
    gfx.lineStyle(1, 0x333333, 1);
    gfx.strokeCircle(31 * T + 14, 35 * T + 14, 7);

    // ── Maisons ──
    const houses = [[21,41],[27,41],[33,41],[21,45],[27,45],[33,45]];
    const roofCols = [0xcc4422, 0x446622, 0x224488, 0x884422, 0x664422, 0x226644];
    houses.forEach(([bx, by], i) => {
      this._drawBuilding(gfx, bx, by, 4, 3, 0xeeddbb, roofCols[i]);
      // Fenêtre gauche
      gfx.fillStyle(0x88ccff, 1);
      gfx.fillRect(bx * T + 4, by * T + 6, T - 6, T - 6);
      gfx.lineStyle(1, 0x6699aa, 1);
      gfx.strokeRect(bx * T + 4, by * T + 6, T - 6, T - 6);
      // Fenêtre droite
      gfx.fillStyle(0x88ccff, 1);
      gfx.fillRect((bx + 2) * T + 4, by * T + 6, T - 6, T - 6);
      gfx.lineStyle(1, 0x6699aa, 1);
      gfx.strokeRect((bx + 2) * T + 4, by * T + 6, T - 6, T - 6);
      // Porte
      gfx.fillStyle(0x7a4422, 1);
      gfx.fillRect((bx + 1) * T + 8, (by + 1) * T + 8, 16, 20);
      gfx.fillStyle(0xffcc44, 1);
      gfx.fillCircle((bx + 1) * T + 22, (by + 1) * T + 18, 2);
    });

    // ── Labels ──
    this.add.text(23 * T + 2, 35 * T + 2, "Centre PKMN", {
      fontSize: "6px", fill: "#ffeeee", fontFamily: "'Press Start 2P', monospace",
      stroke: "#880000", strokeThickness: 2
    }).setDepth(10);
    this.add.text(30 * T + 2, 35 * T + 2, "Poké Mart", {
      fontSize: "6px", fill: "#eeeeff", fontFamily: "'Press Start 2P', monospace",
      stroke: "#001166", strokeThickness: 2
    }).setDepth(10);
  }

  _drawNPC(gfx, px, py, bodyColor, hatColor) {
    // Ombre
    gfx.fillStyle(0x000000, 0.2);
    gfx.fillEllipse(px + 16, py + 30, 14, 5);
    // Jambes
    gfx.fillStyle(0x224488, 1);
    gfx.fillRect(px + 9, py + 20, 5, 9);
    gfx.fillRect(px + 18, py + 20, 5, 9);
    // Chaussures
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(px + 8, py + 28, 7, 3);
    gfx.fillRect(px + 17, py + 28, 7, 3);
    // Corps
    gfx.fillStyle(bodyColor, 1);
    gfx.fillRect(px + 8, py + 10, 16, 12);
    // Bras
    gfx.fillStyle(bodyColor, 1);
    gfx.fillRect(px + 3, py + 11, 5, 8);
    gfx.fillRect(px + 24, py + 11, 5, 8);
    // Tête
    gfx.fillStyle(0xffcc88, 1);
    gfx.fillCircle(px + 16, py + 7, 7);
    // Casquette
    gfx.fillStyle(hatColor, 1);
    gfx.fillRect(px + 8, py + 2, 16, 5);
    gfx.fillRect(px + 6, py + 5, 5, 3);
    // Yeux
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(px + 12, py + 6, 2, 2);
    gfx.fillRect(px + 18, py + 6, 2, 2);
  }

  _drawNPCs(gfx) {
    // NPC1 : infirmière centre pokémon
    this._drawNPC(gfx, 24 * TILE, 38 * TILE, 0xffbbcc, 0xffffff);
    // NPC2 : vendeur
    this._drawNPC(gfx, 31 * TILE, 38 * TILE, 0x4488ff, 0x224499);
    // NPC3 : dresseur errant
    this._drawNPC(gfx, 29 * TILE, 26 * TILE, 0x44aa44, 0x226622);
    // NPC4 : pêcheur près du lac
    this._drawNPC(gfx, 43 * TILE, 19 * TILE, 0xaa8844, 0x664422);
  }

  _createSelfPlayer() {
    const startX = this.trainerData?.x ?? 30 * TILE;
    const startY = this.trainerData?.y ?? 26 * TILE;

    this.playerBody = this.physics.add.image(startX, startY);
    this.playerBody.setVisible(false);
    this.playerBody.setDisplaySize(20, 20);
    this.playerBody.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

    this.physics.add.collider(this.playerBody, this.walls);

    this.playerGfx = this.add.graphics();
    this._drawTrainer(this.playerGfx, true);
    this.playerGfx.x = startX;
    this.playerGfx.y = startY;

    this.playerName = this.add.text(startX, startY - 18, this.trainerData?.name || "Dresseur", {
      fontSize: "7px", fill: "#f0c040", fontFamily: "'Press Start 2P', monospace"
    }).setOrigin(0.5, 1);

    this.lastSavedPos = { x: startX, y: startY };
  }

  _drawTrainer(gfx, isSelf) {
    gfx.clear();
    const body  = isSelf ? 0xff4444 : 0x4488ff;
    const hat   = isSelf ? 0xcc0000 : 0x0033aa;
    const pants = isSelf ? 0x4466cc : 0x1155bb;
    // Ombre
    gfx.fillStyle(0x000000, 0.25);
    gfx.fillEllipse(0, 20, 16, 5);
    // Jambes
    gfx.fillStyle(pants, 1);
    gfx.fillRect(-7, 7, 5, 10);
    gfx.fillRect(2,  7, 5, 10);
    // Chaussures
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(-8, 15, 7, 4);
    gfx.fillRect(1,  15, 7, 4);
    // Corps
    gfx.fillStyle(body, 1);
    gfx.fillRect(-8, -4, 16, 13);
    // Bras
    gfx.fillStyle(body, 1);
    gfx.fillRect(-13, -3, 5, 9);
    gfx.fillRect(8,  -3, 5, 9);
    // Mains
    gfx.fillStyle(0xffcc88, 1);
    gfx.fillCircle(-11, 6, 3);
    gfx.fillCircle(11,  6, 3);
    // Tête
    gfx.fillStyle(0xffcc88, 1);
    gfx.fillCircle(0, -11, 8);
    // Casquette (bord)
    gfx.fillStyle(hat, 1);
    gfx.fillRect(-9, -17, 18, 7);
    gfx.fillRect(-12, -12, 6, 3);
    // Bouton casquette
    gfx.fillStyle(0xffffff, 0.5);
    gfx.fillCircle(0, -15, 2);
    // Yeux
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(-4, -12, 2, 2);
    gfx.fillRect(2,  -12, 2, 2);
    // Contour joueur (soi-même seulement)
    if (isSelf) {
      gfx.lineStyle(1.5, 0xffffff, 0.5);
      gfx.strokeCircle(0, 0, 18);
    }
  }

  _setupRemotePlayers() {
    this.socket?.on("player_joined", (p) => this._addRemotePlayer(p));
    this.socket?.on("player_left", ({ socketId }) => this._removeRemotePlayer(socketId));
    this.socket?.on("player_moved", ({ socketId, x, y }) => {
      const rp = this.players.get(socketId);
      if (!rp) return;
      rp.gfx.x = x;
      rp.gfx.y = y;
      rp.nameText.x = x;
      rp.nameText.y = y - 18;
    });
  }

  _addRemotePlayer(p) {
    if (this.players.has(p.socketId)) return;
    const gfx = this.add.graphics();
    this._drawTrainer(gfx, false);
    gfx.x = p.x;
    gfx.y = p.y;
    const nameText = this.add.text(p.x, p.y - 18, p.name, {
      fontSize: "7px", fill: "#cccccc", fontFamily: "'Press Start 2P', monospace"
    }).setOrigin(0.5, 1);
    this.players.set(p.socketId, { gfx, nameText, data: p });
  }

  _removeRemotePlayer(socketId) {
    const rp = this.players.get(socketId);
    if (!rp) return;
    rp.gfx.destroy();
    rp.nameText.destroy();
    this.players.delete(socketId);
  }

  _setupCamera() {
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.playerGfx, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.8);
  }

  _setupInput() {
    this.inputKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
      downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });
  }

  _setupSocketHandlers() {
    this.socket?.on("chat_message", (data) => {
      if (this.chatCallback) this.chatCallback(data);
    });
  }

  _createUI() {
    this.zoneText = this.add.text(10, 10, "Route 1", {
      fontSize: "8px", fill: "#ffffff", fontFamily: "'Press Start 2P', monospace",
      backgroundColor: "#00000088", padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.healPromptText = this.add.text(0, 0, "💊 Appuie sur E pour soigner", {
      fontSize: "8px", fill: "#ffffff", fontFamily: "'Press Start 2P', monospace",
      backgroundColor: "#cc000099", padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(100).setVisible(false)
      .setPosition(this.scale.width / 2 - 100, this.scale.height / 2 - 60);

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  _animateWater(time) {
    if (!this._waterGfx) return;
    this._waterGfx.clear();
    const wave = Math.sin(time / 600) * 0.15;
    this.waterTiles.forEach(({ x, y }) => {
      const col = wave > 0 ? COL_WATER2 : COL_WATER;
      this._waterGfx.fillStyle(col, 0.4);
      this._waterGfx.fillRect(x - TILE / 2 + 2, y - TILE / 2 + 2, TILE - 4, TILE - 4);
      // Reflet
      this._waterGfx.fillStyle(0xffffff, 0.08 + 0.06 * Math.sin(time / 400 + x));
      this._waterGfx.fillRect(x - 8, y - 4, 16, 3);
    });
  }

  endBattle() {
    this._inBattle = false;
    this._stepsSinceLastFight = 0;
    // Restaurer la position d'avant le combat
    if (this._battleStartPos) {
      this.playerBody.setPosition(this._battleStartPos.x, this._battleStartPos.y);
      this.playerGfx.x = this._battleStartPos.x;
      this.playerGfx.y = this._battleStartPos.y;
      this.playerName.x = this._battleStartPos.x;
      this.playerName.y = this._battleStartPos.y - 18;
      this._battleStartPos = null;
    }
  }

  _checkPokecenter() {
    const px = this.playerGfx.x;
    const py = this.playerGfx.y;
    // Centre Pokémon est aux tiles 22-27, 34-38 (en pixels)
    const centerX = 24 * TILE;
    const centerY = 38 * TILE;
    const dist = Math.abs(px - centerX) + Math.abs(py - centerY);
    const wasNear = this._nearPokecenter;
    this._nearPokecenter = dist < TILE * 5;
    if (this._nearPokecenter && !wasNear) {
      // Affiche message
      if (this.healPromptText) this.healPromptText.setVisible(true);
    } else if (!this._nearPokecenter && wasNear) {
      if (this.healPromptText) this.healPromptText.setVisible(false);
    }
  }

  update(time, delta) {
    if (this._inBattle) return;
    this._handleMovement(delta);
    this._checkGrassEncounter();
    this._checkPokecenter();
    this._updateZoneText();
    this._animateWater(time);

    if (this._nearPokecenter && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.onHeal?.();
      this.healPromptText?.setVisible(false);
    }

    this.saveTimer += delta;
    if (this.saveTimer > 5000) {
      this.saveTimer = 0;
      const px = this.playerGfx.x;
      const py = this.playerGfx.y;
      if (Math.abs(px - this.lastSavedPos.x) > 5 || Math.abs(py - this.lastSavedPos.y) > 5) {
        this.lastSavedPos = { x: px, y: py };
        this.socket?.emit("save_position", { x: px, y: py, map_id: 0 });
      }
    }
  }

  _handleMovement(delta) {
    const keys = this.inputKeys;
    let vx = 0, vy = 0;
    if (keys.left.isDown  || keys.leftArrow.isDown)  vx = -PLAYER_SPEED;
    else if (keys.right.isDown || keys.rightArrow.isDown) vx = PLAYER_SPEED;
    if (keys.up.isDown    || keys.upArrow.isDown)    vy = -PLAYER_SPEED;
    else if (keys.down.isDown  || keys.downArrow.isDown)  vy = PLAYER_SPEED;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.playerBody.setVelocity(vx, vy);
    this.playerGfx.x = this.playerBody.x;
    this.playerGfx.y = this.playerBody.y;
    this.playerName.x = this.playerBody.x;
    this.playerName.y = this.playerBody.y - 18;

    if (vx !== 0 || vy !== 0) {
      this._stepsSinceLastFight++;
      this.socket?.emit("move", { x: this.playerBody.x, y: this.playerBody.y });
    }
  }

  _checkGrassEncounter() {
    const px = this.playerGfx.x;
    const py = this.playerGfx.y;
    const inGrass = this.grassTiles.some(
      (t) => Math.abs(px - t.x) < TILE && Math.abs(py - t.y) < TILE
    );
    if (!inGrass) return;
    if (this._stepsSinceLastFight < 8) return;
    if (Math.random() > 0.04) return;

    this._stepsSinceLastFight = 0;
    this._inBattle = true;
    this._battleStartPos = { x: this.playerBody.x, y: this.playerBody.y };

    // Choisir zone selon position
    let zoneIdx = 0;
    if (px > 34 * TILE || py < 20 * TILE) zoneIdx = 1;
    if (px > 45 * TILE && py < 16 * TILE) zoneIdx = 2;

    const pool = WILD_ENCOUNTERS[zoneIdx];
    const speciesId = pool[Math.floor(Math.random() * pool.length)];
    const level = 2 + Math.floor(zoneIdx * 4) + Math.floor(Math.random() * 6);
    const wildPokemon = createPokemon(speciesId, level);

    if (this.onWildEncounter) this.onWildEncounter(wildPokemon);
  }

  _updateZoneText() {
    const px = this.playerGfx.x;
    const py = this.playerGfx.y;
    let zone = "Route 1";
    if (px >= 20 * TILE && px <= 40 * TILE && py >= 32 * TILE) zone = "Bourg Palette";
    else if (px > 40 * TILE && py < 20 * TILE) zone = "Lac Crespos";
    else if (px > 34 * TILE) zone = "Route 3";
    else if (py > 22 * TILE && py < 26 * TILE) zone = "Route 2";
    this.zoneText.setText(zone);
  }
}
