import Phaser from "phaser";
import { WILD_ENCOUNTERS, SPECIES, createPokemon } from "./PokemonData";

const TILE = 32;
const MAP_W = 60;
const MAP_H = 50;
const PLAYER_SPEED = 150;

// Couleurs de la map
const COL_GRASS   = 0x3a8a3a;
const COL_DARK    = 0x1e5c1e;
const COL_PATH    = 0xc8b46e;
const COL_WATER   = 0x3060d0;
const COL_TREE    = 0x1a5c1a;
const COL_SAND    = 0xe8d88a;
const COL_WALL    = 0x556b2f;

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

    // Layout de la map : chemin central + zones herbe haute + eau + arbres
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = this._getTileType(x, y);
        let color;
        if (tile === "water")   color = COL_WATER;
        else if (tile === "tree") color = COL_TREE;
        else if (tile === "path") color = COL_PATH;
        else if (tile === "tallgrass") color = COL_DARK;
        else if (tile === "sand") color = COL_SAND;
        else color = COL_GRASS;

        gfx.fillStyle(color, 1);
        gfx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);

        if (tile === "tallgrass") {
          this.grassTiles.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
          // Petits brins d'herbe
          gfx.fillStyle(0x2a7c2a, 1);
          gfx.fillRect(x * TILE + 4, y * TILE + 8, 3, 10);
          gfx.fillRect(x * TILE + 12, y * TILE + 5, 3, 13);
          gfx.fillRect(x * TILE + 20, y * TILE + 9, 3, 9);
          gfx.fillRect(x * TILE + 26, y * TILE + 6, 3, 12);
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

  _drawBuildings(gfx) {
    // Centre Pokémon
    gfx.fillStyle(0xee3333, 1);
    gfx.fillRect(22 * TILE, 34 * TILE, 5 * TILE, 4 * TILE);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(23 * TILE + 4, 35 * TILE + 4, 3 * TILE - 8, 1 * TILE - 4);
    // Shop
    gfx.fillStyle(0x3366ee, 1);
    gfx.fillRect(30 * TILE, 34 * TILE, 5 * TILE, 4 * TILE);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(31 * TILE + 4, 35 * TILE + 4, 3 * TILE - 8, 1 * TILE - 4);
    // Maisons
    [[22, 40], [28, 40], [34, 40], [22, 44], [28, 44], [34, 44]].forEach(([bx, by]) => {
      gfx.fillStyle(0xeeddaa, 1);
      gfx.fillRect(bx * TILE, by * TILE, 3 * TILE, 2 * TILE);
      gfx.fillStyle(0xaa5533, 1);
      gfx.fillTriangle(bx * TILE, by * TILE, (bx + 1.5) * TILE, (by - 1) * TILE, (bx + 3) * TILE, by * TILE);
    });

    // Labels
    this.add.text(24 * TILE + 4, 34 * TILE + 2, "Centre\nPKMN", {
      fontSize: "7px", fill: "#ffffff", fontFamily: "'Press Start 2P', monospace", align: "center"
    });
    this.add.text(31 * TILE, 34 * TILE + 2, "Shop", {
      fontSize: "7px", fill: "#ffffff", fontFamily: "'Press Start 2P', monospace"
    });
  }

  _drawNPCs(gfx) {
    // Quelques NPCs statiques (silhouettes)
    const npcPositions = [
      [25, 36], [31, 37], [33, 42],
    ];
    npcPositions.forEach(([nx, ny]) => {
      gfx.fillStyle(0xffcc66, 1);
      gfx.fillCircle(nx * TILE + 16, ny * TILE + 10, 6);
      gfx.fillStyle(0x4488ff, 1);
      gfx.fillRect(nx * TILE + 10, ny * TILE + 16, 12, 10);
    });
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
    // Corps
    gfx.fillStyle(isSelf ? 0xff4444 : 0x4488ff, 1);
    gfx.fillRect(-7, -4, 14, 12);
    // Tête
    gfx.fillStyle(0xffcc88, 1);
    gfx.fillCircle(0, -10, 7);
    // Casquette
    gfx.fillStyle(isSelf ? 0xcc0000 : 0x0044aa, 1);
    gfx.fillRect(-8, -16, 16, 6);
    gfx.fillRect(-10, -12, 4, 3);
    // Jambes
    gfx.fillStyle(0x3366cc, 1);
    gfx.fillRect(-6, 8, 5, 8);
    gfx.fillRect(1, 8, 5, 8);
    // Souliers
    gfx.fillStyle(0x333333, 1);
    gfx.fillRect(-7, 14, 6, 4);
    gfx.fillRect(1, 14, 6, 4);
    if (isSelf) {
      gfx.lineStyle(2, 0xffffff, 0.4);
      gfx.strokeRect(-12, -18, 24, 36);
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
