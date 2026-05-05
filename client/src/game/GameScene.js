import Phaser from "phaser";

const TILE = 32;
const MAP_W = 50;
const MAP_H = 40;
const PLAYER_SPEED = 160;

const CLASS_COLOR = { warrior: 0x4488ff, mage: 0xcc44ff, rogue: 0x44ffaa, paladin: 0xffcc44 };
const CLASS_SHAPE = { warrior: "rect", mage: "circle", rogue: "triangle", paladin: "diamond" };

const MOB_TYPES = [
  { id: "slime",   label: "Slime",    color: 0x55ff55, hp: 30,  atk: 5,  xp: 15,  gold: 5  },
  { id: "goblin",  label: "Goblin",   color: 0xff8800, hp: 45,  atk: 8,  xp: 25,  gold: 10 },
  { id: "orc",     label: "Orc",      color: 0x884400, hp: 80,  atk: 14, xp: 50,  gold: 20 },
  { id: "wolf",    label: "Loup",     color: 0xaaaaaa, hp: 55,  atk: 10, xp: 30,  gold: 12 },
  { id: "vampire", label: "Vampire",  color: 0x880000, hp: 100, atk: 18, xp: 80,  gold: 35 },
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.players = new Map();
    this.mobs = new Map();
    this.socket = null;
    this.selfData = null;
    this.playerGraphic = null;
    this.nameText = null;
    this.inputKeys = null;
    this.lastSavedPos = { x: 0, y: 0 };
    this.saveTimer = 0;
    this.onCombatStart = null;
    this.chatCallback = null;
  }

  init(data) {
    this.socket = data.socket;
    this.selfData = data.selfData;
    this.onCombatStart = data.onCombatStart;
    this.chatCallback = data.chatCallback;
  }

  create() {
    this._buildMap();
    this._spawnMobs();
    this._createSelfPlayer();
    this._setupRemotePlayers();
    this._setupCamera();
    this._setupInput();
    this._setupSocketHandlers();
  }

  _buildMap() {
    const tileGfx = this.add.graphics();
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const isEdge = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
        const isBush = !isEdge && Math.random() < 0.04;
        const color = isEdge ? 0x333355 : isBush ? 0x1a5c2a : (x + y) % 2 === 0 ? 0x1a2a1a : 0x1e2e1e;
        tileGfx.fillStyle(color, 1);
        tileGfx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
      }
    }
    this.mapWidth = MAP_W * TILE;
    this.mapHeight = MAP_H * TILE;

    this.walls = this.physics.add.staticGroup();
    const wallCoords = this._generateWalls();
    wallCoords.forEach(({ x, y }) => {
      const wGfx = this.add.graphics();
      wGfx.fillStyle(0x333355, 1);
      wGfx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
      const wallBody = this.physics.add.staticImage(x * TILE + TILE / 2, y * TILE + TILE / 2);
      wallBody.setVisible(false);
      wallBody.setDisplaySize(TILE, TILE);
      wallBody.refreshBody();
      this.walls.add(wallBody);
    });
  }

  _generateWalls() {
    const walls = [];
    for (let x = 0; x < MAP_W; x++) {
      walls.push({ x, y: 0 }, { x, y: MAP_H - 1 });
    }
    for (let y = 1; y < MAP_H - 1; y++) {
      walls.push({ x: 0, y }, { x: MAP_W - 1, y });
    }
    const rooms = [
      { x: 10, y: 5,  w: 8, h: 6 },
      { x: 30, y: 5,  w: 8, h: 6 },
      { x: 10, y: 25, w: 8, h: 6 },
      { x: 30, y: 25, w: 8, h: 6 },
    ];
    rooms.forEach(({ x, y, w, h }) => {
      for (let i = x; i < x + w; i++) {
        walls.push({ x: i, y }, { x: i, y: y + h - 1 });
      }
      for (let j = y + 1; j < y + h - 1; j++) {
        walls.push({ x, y: j }, { x: x + w - 1, y: j });
      }
      const doorSide = Math.floor(Math.random() * 4);
      if (doorSide === 0) walls.splice(walls.findIndex(w2 => w2.x === x + Math.floor(w / 2) && w2.y === y), 1);
      else if (doorSide === 1) walls.splice(walls.findIndex(w2 => w2.x === x + Math.floor(w / 2) && w2.y === y + h - 1), 1);
      else if (doorSide === 2) walls.splice(walls.findIndex(w2 => w2.x === x && w2.y === y + Math.floor(h / 2)), 1);
      else walls.splice(walls.findIndex(w2 => w2.x === x + w - 1 && w2.y === y + Math.floor(h / 2)), 1);
    });
    return walls;
  }

  _spawnMobs() {
    this.mobs.clear();
    const count = 12;
    for (let i = 0; i < count; i++) {
      const mobType = MOB_TYPES[Math.floor(Math.random() * MOB_TYPES.length)];
      const mx = Phaser.Math.Between(3, MAP_W - 4) * TILE;
      const my = Phaser.Math.Between(3, MAP_H - 4) * TILE;
      const id = `mob_${i}`;
      this._createMobSprite(id, mobType, mx, my);
    }
  }

  _createMobSprite(id, mobType, mx, my) {
    const gfx = this.add.graphics();
    gfx.fillStyle(mobType.color, 1);
    gfx.fillCircle(0, 0, 10);
    gfx.lineStyle(2, 0x000000, 1);
    gfx.strokeCircle(0, 0, 10);

    const container = this.physics.add.image(mx, my);
    container.setVisible(false);
    container.setDisplaySize(22, 22);
    container.setImmovable(true);

    const sprite = this.add.graphics();
    sprite.fillStyle(mobType.color, 1);
    sprite.fillCircle(0, 0, 11);
    sprite.x = mx;
    sprite.y = my;

    const label = this.add.text(mx, my - 18, mobType.label, {
      font: "8px 'Press Start 2P'",
      fill: "#ffffff",
    }).setOrigin(0.5, 1);

    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x330000, 1);
    hpBarBg.fillRect(-16, 12, 32, 5);
    hpBarBg.x = mx;
    hpBarBg.y = my;

    const hpBar = this.add.graphics();
    hpBar.fillStyle(0xe74c3c, 1);
    hpBar.fillRect(-16, 12, 32, 5);
    hpBar.x = mx;
    hpBar.y = my;

    const mobData = {
      id,
      type: mobType,
      hp: mobType.hp,
      maxHp: mobType.hp,
      sprite,
      label,
      hpBarBg,
      hpBar,
      body: container,
      alive: true,
    };

    container.setInteractive(new Phaser.Geom.Circle(0, 0, 11), Phaser.Geom.Circle.Contains);
    container.on("pointerover", () => {
      sprite.setAlpha(0.8);
      this.game.canvas.style.cursor = "pointer";
    });
    container.on("pointerout", () => {
      sprite.setAlpha(1);
      this.game.canvas.style.cursor = "default";
    });
    container.on("pointerdown", () => {
      if (mobData.alive) this._startCombat(mobData);
    });

    this.mobs.set(id, mobData);
    gfx.destroy();
  }

  _createSelfPlayer() {
    const { x, y, class: cls } = this.selfData;
    const color = CLASS_COLOR[cls] || 0xffffff;

    this.playerGraphic = this.add.graphics();
    this._drawPlayerShape(this.playerGraphic, cls, color, true);
    this.playerGraphic.x = x;
    this.playerGraphic.y = y;

    this.playerBody = this.physics.add.image(x, y);
    this.playerBody.setVisible(false);
    this.playerBody.setDisplaySize(24, 24);
    this.playerBody.setCollideWorldBounds(false);

    this.physics.add.collider(this.playerBody, this.walls);

    this.nameText = this.add.text(x, y - 22, this.selfData.name, {
      font: "8px 'Press Start 2P'",
      fill: "#f0c040",
    }).setOrigin(0.5, 1);

    this.lastSavedPos = { x, y };
  }

  _drawPlayerShape(gfx, cls, color, self) {
    gfx.clear();
    gfx.lineStyle(self ? 3 : 2, 0x000000, 1);
    gfx.fillStyle(color, 1);
    const shape = CLASS_SHAPE[cls] || "rect";
    if (shape === "rect") {
      gfx.fillRect(-11, -11, 22, 22);
      gfx.strokeRect(-11, -11, 22, 22);
    } else if (shape === "circle") {
      gfx.fillCircle(0, 0, 12);
      gfx.strokeCircle(0, 0, 12);
    } else if (shape === "triangle") {
      gfx.fillTriangle(0, -12, -11, 11, 11, 11);
      gfx.strokeTriangle(0, -12, -11, 11, 11, 11);
    } else if (shape === "diamond") {
      gfx.fillTriangle(0, -13, -11, 0, 0, 13);
      gfx.fillTriangle(0, -13, 11, 0, 0, 13);
      gfx.strokeTriangle(0, -13, -11, 0, 11, 0);
      gfx.strokeTriangle(0, 13, -11, 0, 11, 0);
    }
    if (self) {
      gfx.lineStyle(2, 0xffffff, 0.5);
      gfx.strokeRect(-14, -14, 28, 28);
    }
  }

  _setupRemotePlayers() {
    this.socket.on("player_joined", (p) => this._addRemotePlayer(p));
    this.socket.on("player_left", ({ socketId }) => this._removeRemotePlayer(socketId));
    this.socket.on("player_moved", ({ socketId, x, y }) => {
      const rp = this.players.get(socketId);
      if (!rp) return;
      rp.gfx.x = x;
      rp.gfx.y = y;
      rp.nameText.x = x;
      rp.nameText.y = y - 22;
    });
  }

  _addRemotePlayer(p) {
    if (this.players.has(p.socketId)) return;
    const color = CLASS_COLOR[p.class] || 0xffffff;
    const gfx = this.add.graphics();
    this._drawPlayerShape(gfx, p.class, color, false);
    gfx.x = p.x;
    gfx.y = p.y;
    const nameText = this.add.text(p.x, p.y - 22, p.name, {
      font: "8px 'Press Start 2P'",
      fill: "#cccccc",
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
    this.cameras.main.startFollow(this.playerGraphic, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }

  _setupInput() {
    this.inputKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
      downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });
    this.input.setDefaultCursor("default");
  }

  _setupSocketHandlers() {
    this.socket.on("chat_message", (data) => {
      if (this.chatCallback) this.chatCallback(data);
    });
  }

  _startCombat(mobData) {
    if (this.onCombatStart) {
      this.onCombatStart(mobData);
    }
  }

  update(time, delta) {
    this._handleMovement(delta);
    this._syncMobVisuals();

    this.saveTimer += delta;
    if (this.saveTimer > 5000) {
      this.saveTimer = 0;
      const px = this.playerGraphic.x;
      const py = this.playerGraphic.y;
      if (Math.abs(px - this.lastSavedPos.x) > 5 || Math.abs(py - this.lastSavedPos.y) > 5) {
        this.lastSavedPos = { x: px, y: py };
        this.socket.emit("save_position", { x: px, y: py, map_id: 0 });
      }
    }
  }

  _handleMovement(delta) {
    const keys = this.inputKeys;
    let vx = 0, vy = 0;
    if (keys.left.isDown || keys.leftArrow.isDown) vx = -PLAYER_SPEED;
    else if (keys.right.isDown || keys.rightArrow.isDown) vx = PLAYER_SPEED;
    if (keys.up.isDown || keys.upArrow.isDown) vy = -PLAYER_SPEED;
    else if (keys.down.isDown || keys.downArrow.isDown) vy = PLAYER_SPEED;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.playerBody.setVelocity(vx, vy);
    this.playerGraphic.x = this.playerBody.x;
    this.playerGraphic.y = this.playerBody.y;
    this.nameText.x = this.playerBody.x;
    this.nameText.y = this.playerBody.y - 22;

    if (vx !== 0 || vy !== 0) {
      this.socket.emit("move", { x: this.playerBody.x, y: this.playerBody.y });
    }
  }

  _syncMobVisuals() {
    this.mobs.forEach((mob) => {
      if (!mob.alive) return;
      const ratio = mob.hp / mob.maxHp;
      mob.hpBar.clear();
      mob.hpBar.fillStyle(0xe74c3c, 1);
      mob.hpBar.fillRect(-16, 12, Math.floor(32 * ratio), 5);
    });
  }

  damageMob(mobId, damage) {
    const mob = this.mobs.get(mobId);
    if (!mob || !mob.alive) return false;
    mob.hp = Math.max(0, mob.hp - damage);
    if (mob.hp <= 0) {
      mob.alive = false;
      mob.sprite.destroy();
      mob.label.destroy();
      mob.hpBarBg.destroy();
      mob.hpBar.destroy();
      mob.body.destroy();
      this.mobs.delete(mobId);
      return true;
    }
    return false;
  }

  getMobHP(mobId) {
    return this.mobs.get(mobId)?.hp ?? 0;
  }
}
