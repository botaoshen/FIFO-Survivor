const flyImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968324/fly_mrzgq4.png';
const groundImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968886/ground_texture_klpu1s.png';
const daveImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772965522/Dave_the_miner_akwikr.png';

const enemy1 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968321/enemy1_psbc1j.png';
const enemy2 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968321/enemy2_widf0y.png';
const enemy3 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968321/enemy3_vhtmw7.png';
const enemy4 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968322/enemy4_klnfmk.png';
const enemy5 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968322/enemy5_s2vmra.png';
const enemy6 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968323/enemy6_lcbgz7.png';
const enemy7 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968324/enemy7_fbqunu.png';

const gemImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1773018790/diamond_2_w69ojw.png';
const pieImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1773018791/pie_xns3v6.png';
const redbullImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1773018790/redbull_oxiyax.png';
const pickImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1773029911/pick_s5igm2.png';

const prop1 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968885/prop1_xxwq96.png';
const prop2 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968888/prop2_hzro4w.png';
const prop3 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968889/prop3_rkhheg.png';
const prop4 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968889/prop4_g6sgih.png';
const prop5 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968891/prop5_uyla8p.png';
const bgmAudio = 'https://res.cloudinary.com/dhc60qvv3/video/upload/v1772968905/bgm_ek7r3n.mp3';

export type GameState = 'menu' | 'playing' | 'levelup' | 'gameover' | 'paused';

interface SpriteDef {
  x: number; y: number; w: number; h: number;
  frames?: number; speed?: number;
}

const SPRITES: Record<string, SpriteDef> = {
  davo: { x: 0, y: 0, w: 128, h: 128 },
  fly: { x: 128, y: 0, w: 128, h: 128, frames: 2, speed: 10 },
  croc: { x: 256, y: 0, w: 128, h: 128, frames: 4, speed: 8 },
  clock: { x: 384, y: 0, w: 128, h: 128, frames: 4, speed: 8 },
  fire: { x: 512, y: 0, w: 128, h: 128, frames: 4, speed: 10 },
  pie: { x: 0, y: 128, w: 64, h: 64 },
  cone: { x: 64, y: 128, w: 64, h: 64 },
  gem_blue: { x: 128, y: 128, w: 64, h: 64 },
  gem_green: { x: 192, y: 128, w: 64, h: 64 },
};

export interface Vector2 { x: number; y: number; }

export interface Enemy {
  id: number; pos: Vector2; type: 'enemy0' | 'enemy1' | 'enemy2' | 'enemy3' | 'enemy4' | 'enemy5' | 'enemy6' | 'enemy7';
  hp: number; maxHp: number; speed: number; damage: number; radius: number; knockback: Vector2;
  frame: number;
}

export interface Projectile {
  id: number; pos: Vector2; vel: Vector2; type: 'cone' | 'pie' | 'stone';
  damage: number; radius: number; life: number; pierce: number; hitEnemies: Set<number>;
  rotation: number;
}

export interface Collectible {
  id: number; pos: Vector2; type: 'gem_blue' | 'gem_green' | 'pie' | 'beer' | 'coffee' | 'magnet' | 'dynamite' | 'mystery_box';
  value: number; radius: number;
}

export interface Particle {
  pos: Vector2; vel: Vector2; life: number; maxLife: number; color: string; size: number;
}

export interface Prop {
  id: number; pos: Vector2; type: number; scale: number;
}

export interface UpgradeOption { id: string; title: string; description: string; icon: string; }

export interface GameCallbacks {
  onStateChange: (state: GameState) => void;
  onStatsChange: (stats: any) => void;
  onLevelUp: (options: UpgradeOption[]) => void;
}

export class GameEngine {
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; callbacks: GameCallbacks;
  lastTime: number = 0; animationId: number = 0; keys: { [key: string]: boolean } = {};
  state: GameState = 'menu';

  // Touch controls
  touchActive: boolean = false;
  touchStart: Vector2 = { x: 0, y: 0 };
  touchCurrent: Vector2 = { x: 0, y: 0 };
  touchId: number | null = null;

  player = {
    pos: { x: 0, y: 0 }, hp: 100, maxHp: 100, speed: 200, radius: 25,
    xp: 0, level: 1, xpToNext: 30, gems: 0, pies: 0, damageMultiplier: 1,
    facing: 'down', isMoving: false, frame: 0, isAttacking: false, attackTimer: 0,
    characterId: 'dave'
  };

  weapons = {
    exclusive: { level: 1, damage: 15, radius: 80, rotationSpeed: Math.PI * 3, angle: 0, active: true },
    stone: { level: 1, damage: 10, fireRate: 1.0, cooldown: 0, speed: 400, pierce: 1 },
    cones: { level: 0, damage: 20, fireRate: 1.5, cooldown: 0, speed: 400, pierce: 2 },
    pies: { level: 0, damage: 10, fireRate: 2.0, cooldown: 0, speed: 300, pierce: 1 },
  };

  enemies: Enemy[] = []; projectiles: Projectile[] = []; collectibles: Collectible[] = []; particles: Particle[] = []; props: Prop[] = [];
  camera = { x: 0, y: 0 }; time: number = 0; enemySpawnTimer: number = 0; enemySpawnRate: number = 2.0;
  bossSpawnTimer: number = 60;
  difficultyMultiplier: number = 1.0; nextId = 1;
  specialItemSpawnTimer: number = 15;

  buffs = {
    speedBoost: 0,
    damageBoost: 0,
  };

  spriteSheet: HTMLImageElement;
  spritesLoaded: boolean = false;
  davoSpriteSheet: HTMLImageElement;
  davoSpritesLoaded: boolean = false;
  isSingleImageDavo: boolean = false;
  flySpriteSheet: HTMLImageElement;
  flySpritesLoaded: boolean = false;
  groundTexture: HTMLImageElement;
  groundTextureLoaded: boolean = false;
  groundPattern: CanvasPattern | null = null;
  
  propImages: HTMLImageElement[] = [];
  propsLoaded: boolean[] = [false, false, false, false, false];

  enemyImages: HTMLImageElement[] = [];
  enemiesLoaded: boolean[] = [false, false, false, false, false, false, false];

  gemImage: HTMLImageElement;
  gemLoaded: boolean = false;
  pieImage: HTMLImageElement;
  pieLoaded: boolean = false;
  redbullImage: HTMLImageElement;
  redbullLoaded: boolean = false;
  pickImage: HTMLImageElement;
  pickLoaded: boolean = false;

  bgm: HTMLAudioElement;
  bgmEnabled: boolean = true;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d')!; this.callbacks = callbacks;
    
    this.spriteSheet = new Image();
    // sprites.png is missing, we rely on canvas fallback drawing for gems/pies
    // this.spriteSheet.src = '/sprites.png';
    this.spriteSheet.onload = () => { this.spritesLoaded = true; };

    this.davoSpriteSheet = new Image();
    // Use imported daveImg as the default
    this.davoSpriteSheet.src = daveImg;
    this.isSingleImageDavo = true; // dave_the_miner.png is a single image
    this.davoSpriteSheet.onload = () => { this.davoSpritesLoaded = true; };

    this.flySpriteSheet = new Image();
    this.flySpriteSheet.src = flyImg;
    this.flySpriteSheet.onload = () => { this.flySpritesLoaded = true; };
    this.flySpriteSheet.onerror = () => { /* Fallback to canvas drawing */ };

    this.groundTexture = new Image();
    this.groundTexture.src = groundImg;
    this.groundTexture.onload = () => { 
      this.groundTextureLoaded = true; 
      this.groundPattern = this.ctx.createPattern(this.groundTexture, 'repeat');
    };
    this.groundTexture.onerror = () => { /* Fallback to canvas drawing */ };

    const propSrcs = [prop1, prop2, prop3, prop4, prop5];
    for (let i = 0; i < 5; i++) {
      const img = new Image();
      img.src = propSrcs[i];
      img.onload = () => { this.propsLoaded[i] = true; };
      this.propImages.push(img);
    }

    const enemySrcs = [enemy1, enemy2, enemy3, enemy4, enemy5, enemy6, enemy7];
    for (let i = 0; i < 7; i++) {
      const img = new Image();
      img.src = enemySrcs[i];
      img.onload = () => { this.enemiesLoaded[i] = true; };
      this.enemyImages.push(img);
    }

    this.gemImage = new Image();
    this.gemImage.src = gemImg;
    this.gemImage.onload = () => { this.gemLoaded = true; };

    this.pieImage = new Image();
    this.pieImage.src = pieImg;
    this.pieImage.onload = () => { this.pieLoaded = true; };

    this.redbullImage = new Image();
    this.redbullImage.src = redbullImg;
    this.redbullImage.onload = () => { this.redbullLoaded = true; };

    this.pickImage = new Image();
    this.pickImage.src = pickImg;
    this.pickImage.onload = () => { this.pickLoaded = true; };

    this.handleKeyDown = this.handleKeyDown.bind(this); this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleResize = this.handleResize.bind(this); this.loop = this.loop.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    window.addEventListener('keydown', this.handleKeyDown); window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize); this.handleResize();
    
    window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

    this.bgm = new Audio(bgmAudio);
    this.bgm.loop = true;
    this.bgm.volume = 0.5;
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      if (this.state === 'playing' || this.state === 'paused' || this.state === 'menu' || this.state === 'gameover') {
        this.bgm.play().catch(e => console.log('Audio play failed:', e));
      }
    } else {
      this.bgm.pause();
    }
    return this.bgmEnabled;
  }

  playBGM() {
    if (this.bgmEnabled) {
      this.bgm.play().catch(e => console.log('Audio play failed:', e));
    }
  }

  setBGMVolume(volume: number) {
    this.bgm.volume = volume;
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown); window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize); cancelAnimationFrame(this.animationId);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);
  }

  setCustomSpriteSheet(type: 'sprites' | 'davo' | 'single_davo', url: string) {
    if (type === 'sprites') {
      this.spriteSheet.src = url;
      this.spriteSheet.onload = () => { this.spritesLoaded = true; };
      this.spriteSheet.onerror = () => { this.spritesLoaded = false; };
    } else if (type === 'davo') {
      if (!url) {
        this.davoSpritesLoaded = false;
        this.isSingleImageDavo = false;
        return;
      }
      this.isSingleImageDavo = false;
      this.davoSpriteSheet.src = url;
      this.davoSpriteSheet.onload = () => { this.davoSpritesLoaded = true; };
      this.davoSpriteSheet.onerror = () => { this.davoSpritesLoaded = false; };
    } else if (type === 'single_davo') {
      if (!url) {
        this.davoSpritesLoaded = false;
        this.isSingleImageDavo = false;
        return;
      }
      this.isSingleImageDavo = true;
      this.davoSpriteSheet.src = url;
      this.davoSpriteSheet.onload = () => { this.davoSpritesLoaded = true; };
      this.davoSpriteSheet.onerror = () => { this.davoSpritesLoaded = false; };
    }
  }

  handleKeyDown(e: KeyboardEvent) { 
    const key = e.key.toLowerCase();
    if (!this.keys[key] && (e.code === 'Space' || e.key === ' ')) {
      e.preventDefault();
      this.togglePause();
    }
    this.keys[key] = true; 
  }
  handleKeyUp(e: KeyboardEvent) { this.keys[e.key.toLowerCase()] = false; }
  
  handleTouchStart(e: TouchEvent) {
    if (this.state !== 'playing') return;
    // Prevent scrolling/zooming
    if (e.target === this.canvas) e.preventDefault();
    
    const touch = e.changedTouches[0];
    this.touchId = touch.identifier;
    this.touchStart = { x: touch.clientX, y: touch.clientY };
    this.touchCurrent = { x: touch.clientX, y: touch.clientY };
    this.touchActive = true;
  }

  handleTouchMove(e: TouchEvent) {
    if (!this.touchActive || this.state !== 'playing') return;
    if (e.target === this.canvas) e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.touchId) {
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
      }
    }
  }

  handleTouchEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.touchId) {
        this.touchActive = false;
        this.touchId = null;
      }
    }
  }

  handleResize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }

  start(characterId: string = 'dave') {
    cancelAnimationFrame(this.animationId);
    this.state = 'playing'; this.callbacks.onStateChange(this.state);
    
    // Attempt to play BGM if not already playing (don't reset currentTime)
    if (this.bgmEnabled) {
      this.bgm.play().catch(e => console.log('Audio play failed:', e));
    }

    this.player = { pos: { x: 0, y: 0 }, hp: 100, maxHp: 100, speed: 200, radius: 40, xp: 0, level: 1, xpToNext: 30, gems: 0, pies: 0, damageMultiplier: 1, facing: 'down', isMoving: false, frame: 0, isAttacking: false, attackTimer: 0, characterId };
    this.weapons = {
      exclusive: { level: 1, damage: 15, radius: 80, rotationSpeed: Math.PI * 3, angle: 0, active: true },
      stone: { level: 1, damage: 10, fireRate: 1.0, cooldown: 0, speed: 400, pierce: 1 },
      cones: { level: 0, damage: 20, fireRate: 1.5, cooldown: 0, speed: 400, pierce: 2 },
      pies: { level: 0, damage: 10, fireRate: 2.0, cooldown: 0, speed: 300, pierce: 1 },
    };
    this.enemies = []; this.projectiles = []; this.collectibles = []; this.particles = []; this.props = [];
    
    // Generate random props
    for (let i = 0; i < 150; i++) {
      const type = Math.floor(Math.random() * 5);
      this.props.push({
        id: this.nextId++,
        pos: { x: (Math.random() - 0.5) * 6000, y: (Math.random() - 0.5) * 6000 },
        type, // 0, 1, 2, 3, 4
        scale: 0.1
      });
    }
    
    this.time = 0; this.enemySpawnRate = 2.0; this.difficultyMultiplier = 1.0; this.bossSpawnTimer = 60;
    this.lastTime = performance.now(); this.updateStats(); this.animationId = requestAnimationFrame(this.loop);
  }

  pause() { 
    cancelAnimationFrame(this.animationId); 
    this.bgm.pause();
  }
  resume() { 
    this.lastTime = performance.now(); 
    this.animationId = requestAnimationFrame(this.loop); 
    if (this.bgmEnabled) {
      this.bgm.play().catch(e => console.log('Audio play failed:', e));
    }
  }
  
  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.callbacks.onStateChange(this.state);
      this.pause();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.callbacks.onStateChange(this.state);
      this.resume();
    }
  }

  loop(timestamp: number) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    if (this.state === 'playing') { this.update(dt); this.draw(); }
    if (this.state === 'playing' || this.state === 'gameover') this.animationId = requestAnimationFrame(this.loop);
  }

  update(dt: number) {
    this.time += dt; this.difficultyMultiplier = 1 + this.time / 60;
    this.updatePlayer(dt); this.updateWeapons(dt); this.updateEnemies(dt);
    this.updateProjectiles(dt); this.updateCollectibles(dt); this.updateParticles(dt); this.spawnEnemies(dt);
    this.spawnSpecialItems(dt);
    this.camera.x = this.player.pos.x - this.canvas.width / 2; this.camera.y = this.player.pos.y - this.canvas.height / 2;
  }

  updatePlayer(dt: number) {
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    // Touch movement
    if (this.touchActive && dx === 0 && dy === 0) {
      const tdx = this.touchCurrent.x - this.touchStart.x;
      const tdy = this.touchCurrent.y - this.touchStart.y;
      const dist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (dist > 10) { // Deadzone
        dx = tdx / dist;
        dy = tdy / dist;
      }
    }
    
    this.player.isMoving = (dx !== 0 || dy !== 0);
    
    let currentSpeed = this.player.speed;
    if (this.buffs.speedBoost > 0) {
      currentSpeed *= 1.6;
      this.buffs.speedBoost -= dt;
      if (Math.random() < 0.3) this.spawnParticle(this.player.pos, { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 }, '#f1c40f', 4, 0.4);
    }

    if (this.player.isMoving) {
      this.player.frame += dt * 10;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.facing = dx > 0 ? 'right' : 'left';
      } else {
        this.player.facing = dy > 0 ? 'down' : 'up';
      }
      const len = Math.sqrt(dx * dx + dy * dy);
      this.player.pos.x += (dx / len) * currentSpeed * dt;
      this.player.pos.y += (dy / len) * currentSpeed * dt;
      if (Math.random() < 0.2) this.spawnParticle({ x: this.player.pos.x, y: this.player.pos.y + 20 }, { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20 }, 'rgba(150, 75, 50, 0.5)', Math.random() * 5 + 5, 0.5);
    } else {
      this.player.frame += dt * 5; // Idle animation speed
    }

    if (this.player.isAttacking) {
      this.player.attackTimer -= dt;
      if (this.player.attackTimer <= 0) {
        this.player.isAttacking = false;
      }
    }
  }

  fireProjectile(weapon: any, type: 'cone' | 'pie') {
    if (this.enemies.length === 0) return;
    let nearestDist = Infinity, nearestEnemy: Enemy | null = null;
    for (const enemy of this.enemies) {
      const dist = this.getDist(this.player.pos, enemy.pos);
      if (dist < nearestDist) { nearestDist = dist; nearestEnemy = enemy; }
    }
    if (nearestEnemy) {
      const angle = Math.atan2(nearestEnemy.pos.y - this.player.pos.y, nearestEnemy.pos.x - this.player.pos.x);
      this.projectiles.push({
        id: this.nextId++, pos: { x: this.player.pos.x, y: this.player.pos.y },
        vel: { x: Math.cos(angle) * weapon.speed, y: Math.sin(angle) * weapon.speed },
        type, damage: weapon.damage * this.player.damageMultiplier, radius: 15, life: 3.0, pierce: weapon.pierce, hitEnemies: new Set(), rotation: 0
      });
    }
  }

  fireStone() {
    const dirMap: Record<string, { x: number, y: number }> = {
      'down': { x: 0, y: 1 },
      'right': { x: 1, y: 0 },
      'left': { x: -1, y: 0 },
      'up': { x: 0, y: -1 }
    };
    const dir = dirMap[this.player.facing] || { x: 0, y: 1 };
    
    this.projectiles.push({
      id: this.nextId++,
      pos: { x: this.player.pos.x, y: this.player.pos.y },
      vel: { x: dir.x * this.weapons.stone.speed, y: dir.y * this.weapons.stone.speed },
      type: 'stone',
      damage: this.weapons.stone.damage * this.player.damageMultiplier,
      radius: 8,
      life: 2.0,
      pierce: this.weapons.stone.pierce,
      hitEnemies: new Set(),
      rotation: 0
    });
  }

  updateWeapons(dt: number) {
    // Exclusive Aura Weapon
    this.weapons.exclusive.angle += this.weapons.exclusive.rotationSpeed * dt;
    const pAngle = this.weapons.exclusive.angle % (Math.PI * 2);
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (this.getDist(this.player.pos, enemy.pos) < this.weapons.exclusive.radius + enemy.radius) {
        let enemyAngle = Math.atan2(enemy.pos.y - this.player.pos.y, enemy.pos.x - this.player.pos.x);
        let angleDiff = enemyAngle - pAngle;
        
        while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        
        // Only hit if enemy is within a 90-degree arc
        if (Math.abs(angleDiff) <= Math.PI / 4) {
          enemy.hp -= this.weapons.exclusive.damage * this.player.damageMultiplier * dt * 20;
          const kbAngle = Math.atan2(enemy.pos.y - this.player.pos.y, enemy.pos.x - this.player.pos.x);
          enemy.knockback.x = Math.cos(kbAngle) * 150; enemy.knockback.y = Math.sin(kbAngle) * 150;
          if (Math.random() < 0.1) this.spawnParticle(enemy.pos, { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 }, '#fff', 2, 0.2);
          if (enemy.hp <= 0) {
            this.killEnemy(enemy);
            this.enemies.splice(i, 1);
          }
          
          // Trigger attack animation
          this.player.isAttacking = true;
          this.player.attackTimer = 0.2;
        }
      }
    }

    // Stone (Fires in facing direction)
    if (this.weapons.stone.level > 0) {
      this.weapons.stone.cooldown -= dt;
      if (this.weapons.stone.cooldown <= 0) {
        this.weapons.stone.cooldown = this.weapons.stone.fireRate;
        this.fireStone();
      }
    }

    // Cones
    if (this.weapons.cones.level > 0) {
      this.weapons.cones.cooldown -= dt;
      if (this.weapons.cones.cooldown <= 0) {
        this.weapons.cones.cooldown = this.weapons.cones.fireRate;
        this.fireProjectile(this.weapons.cones, 'cone');
      }
    }

    // Pies
    if (this.weapons.pies.level > 0) {
      this.weapons.pies.cooldown -= dt;
      if (this.weapons.pies.cooldown <= 0) {
        this.weapons.pies.cooldown = this.weapons.pies.fireRate;
        this.fireProjectile(this.weapons.pies, 'pie');
      }
    }
  }

  updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.frame += dt * 10;
      enemy.pos.x += enemy.knockback.x * dt; enemy.pos.y += enemy.knockback.y * dt;
      enemy.knockback.x *= 0.9; enemy.knockback.y *= 0.9;
      const angle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
      enemy.pos.x += Math.cos(angle) * enemy.speed * dt; enemy.pos.y += Math.sin(angle) * enemy.speed * dt;
      if (this.getDist(this.player.pos, enemy.pos) < this.player.radius + enemy.radius) {
        this.player.hp -= enemy.damage * dt; this.updateStats();
        if (this.player.hp <= 0) { 
          this.state = 'gameover'; 
          this.callbacks.onStateChange(this.state); 
          // Keep BGM playing for game over screen (dashboard stage)
          return; 
        }
      }
    }
  }

  updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt; p.life -= dt; p.rotation += dt * 10;
      if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }
      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (p.hitEnemies.has(enemy.id)) continue;
        if (this.getDist(p.pos, enemy.pos) < p.radius + enemy.radius) {
          enemy.hp -= p.damage; p.hitEnemies.add(enemy.id); p.pierce--;
          enemy.knockback.x += p.vel.x * 0.1; enemy.knockback.y += p.vel.y * 0.1;
          for (let k = 0; k < 3; k++) this.spawnParticle(enemy.pos, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }, '#ff0000', 3, 0.3);
          if (enemy.hp <= 0) { this.killEnemy(enemy); this.enemies.splice(j, 1); }
          if (p.pierce <= 0) { this.projectiles.splice(i, 1); hit = true; break; }
        }
      }
    }
  }

  updateCollectibles(dt: number) {
    const pickupRadius = 120;
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      const dist = this.getDist(this.player.pos, c.pos);
      if (dist < pickupRadius) {
        const angle = Math.atan2(this.player.pos.y - c.pos.y, this.player.pos.x - c.pos.x);
        const speed = 500 * (1 - dist / pickupRadius);
        c.pos.x += Math.cos(angle) * speed * dt; c.pos.y += Math.sin(angle) * speed * dt;
        if (dist < this.player.radius + c.radius) {
          if (c.type === 'pie') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
            this.player.pies++;
          } else if (c.type === 'beer') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
            for (let k = 0; k < 10; k++) this.spawnParticle(this.player.pos, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }, '#e74c3c', 5, 0.5);
          } else if (c.type === 'coffee') {
            this.buffs.speedBoost = 10; // 10 seconds speed boost
            for (let k = 0; k < 10; k++) this.spawnParticle(this.player.pos, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }, '#f1c40f', 5, 0.5);
          } else if (c.type === 'magnet') {
            // Pull all gems
            for (const col of this.collectibles) {
              if (col.type === 'gem_blue' || col.type === 'gem_green') {
                const angle = Math.atan2(this.player.pos.y - col.pos.y, this.player.pos.x - col.pos.x);
                col.pos.x += Math.cos(angle) * 1000; col.pos.y += Math.sin(angle) * 1000;
              }
            }
          } else if (c.type === 'dynamite') {
            // Clear nearby enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const enemy = this.enemies[j];
              if (this.getDist(this.player.pos, enemy.pos) < 500) {
                enemy.hp = 0;
                this.killEnemy(enemy);
                this.enemies.splice(j, 1);
              }
            }
            for (let k = 0; k < 30; k++) this.spawnParticle(this.player.pos, { x: (Math.random() - 0.5) * 500, y: (Math.random() - 0.5) * 500 }, '#e67e22', 10, 0.8);
          } else if (c.type === 'mystery_box') {
            const upgrades = this.generateUpgrades();
            const randomUpgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
            this.applyUpgrade(randomUpgrade.id);
            for (let k = 0; k < 20; k++) this.spawnParticle(this.player.pos, { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 }, '#9b59b6', 8, 0.6);
          } else {
            this.player.xp += c.value;
            this.player.gems += c.value;
          }
          this.collectibles.splice(i, 1); this.checkLevelUp(); this.updateStats();
        }
      }
    }
  }

  updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt; p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnParticle(pos: Vector2, vel: Vector2, color: string, size: number, life: number) {
    this.particles.push({ pos: { ...pos }, vel: { ...vel }, color, size, life, maxLife: life });
  }

  spawnEnemies(dt: number) {
    this.bossSpawnTimer -= dt;
    if (this.bossSpawnTimer <= 0) {
      this.bossSpawnTimer = 60; // Reset boss timer
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(this.canvas.width, this.canvas.height) / 2 + 100;
      const pos = { x: this.player.pos.x + Math.cos(angle) * dist, y: this.player.pos.y + Math.sin(angle) * dist };
      const hp = 500 * this.difficultyMultiplier;
      this.enemies.push({ id: this.nextId++, pos, type: 'enemy7', hp, maxHp: hp, speed: 60, damage: 50 * this.difficultyMultiplier, radius: 50, knockback: { x: 0, y: 0 }, frame: Math.random() * 10 });
    }

    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      this.enemySpawnRate = Math.max(0.3, 2.0 - this.time / 120); this.enemySpawnTimer = this.enemySpawnRate;
      const numToSpawn = Math.floor(this.difficultyMultiplier);
      for (let i = 0; i < numToSpawn; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.canvas.width, this.canvas.height) / 2 + 100;
        const pos = { x: this.player.pos.x + Math.cos(angle) * dist, y: this.player.pos.y + Math.sin(angle) * dist };
        const rand = Math.random();
        let type: 'enemy0' | 'enemy1' | 'enemy2' | 'enemy3' | 'enemy4' | 'enemy5' | 'enemy6' = 'enemy0';
        let hp = 5 * this.difficultyMultiplier, speed = 100, damage = 2 * this.difficultyMultiplier, radius = 12;
        
        if (rand > 0.9 && this.time > 50) { type = 'enemy6'; hp = 120 * this.difficultyMultiplier; speed = 80; damage = 30 * this.difficultyMultiplier; radius = 35; }
        else if (rand > 0.8 && this.time > 40) { type = 'enemy5'; hp = 90 * this.difficultyMultiplier; speed = 100; damage = 25 * this.difficultyMultiplier; radius = 30; }
        else if (rand > 0.65 && this.time > 30) { type = 'enemy4'; hp = 60 * this.difficultyMultiplier; speed = 110; damage = 20 * this.difficultyMultiplier; radius = 25; }
        else if (rand > 0.45 && this.time > 20) { type = 'enemy3'; hp = 30 * this.difficultyMultiplier; speed = 90; damage = 10 * this.difficultyMultiplier; radius = 22; }
        else if (rand > 0.25 && this.time > 10) { type = 'enemy2'; hp = 25 * this.difficultyMultiplier; speed = 130; damage = 10 * this.difficultyMultiplier; radius = 18; }
        else if (rand > 0.1 && this.time > 5) { type = 'enemy1'; hp = 10 * this.difficultyMultiplier; speed = 150; damage = 5 * this.difficultyMultiplier; radius = 15; }
        
        this.enemies.push({ id: this.nextId++, pos, type, hp, maxHp: hp, speed, damage, radius, knockback: { x: 0, y: 0 }, frame: Math.random() * 10 });
      }
    }
  }

  spawnSpecialItems(dt: number) {
    this.specialItemSpawnTimer -= dt;
    if (this.specialItemSpawnTimer <= 0) {
      this.specialItemSpawnTimer = 20 + Math.random() * 20; // Spawn every 20-40 seconds
      
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(this.canvas.width, this.canvas.height) / 2 + 200;
      const pos = { x: this.player.pos.x + Math.cos(angle) * dist, y: this.player.pos.y + Math.sin(angle) * dist };
      
      const rand = Math.random();
      let type: 'beer' | 'coffee' | 'magnet' | 'dynamite' | 'mystery_box' = 'beer';
      if (rand > 0.9) type = 'mystery_box';
      else if (rand > 0.7) type = 'dynamite';
      else if (rand > 0.5) type = 'magnet';
      else if (rand > 0.25) type = 'coffee';
      
      this.collectibles.push({ id: this.nextId++, pos, type, value: 0, radius: 20 });
    }
  }

  killEnemy(enemy: Enemy) {
    const rand = Math.random();
    if (enemy.type === 'enemy7') {
      // Boss drops 5 green gems
      for (let i = 0; i < 5; i++) {
        this.collectibles.push({ id: this.nextId++, pos: { x: enemy.pos.x + (Math.random() - 0.5) * 60, y: enemy.pos.y + (Math.random() - 0.5) * 60 }, type: 'gem_green', value: 5, radius: 10 });
      }
      // Boss also has a high chance to drop a mystery box
      if (Math.random() < 0.5) {
        this.collectibles.push({ id: this.nextId++, pos: { ...enemy.pos }, type: 'mystery_box', value: 0, radius: 20 });
      }
    } else if (rand < 0.01) {
      // 1% chance for special item from regular enemy
      const types: ('beer' | 'coffee' | 'magnet' | 'dynamite')[] = ['beer', 'coffee', 'magnet', 'dynamite'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.collectibles.push({ id: this.nextId++, pos: { ...enemy.pos }, type, value: 0, radius: 20 });
    } else if (rand < 0.05) {
      this.collectibles.push({ id: this.nextId++, pos: { ...enemy.pos }, type: 'pie', value: 0, radius: 12 });
    } else {
      this.collectibles.push({ id: this.nextId++, pos: { ...enemy.pos }, type: (enemy.type === 'enemy5' || enemy.type === 'enemy6') ? 'gem_green' : 'gem_blue', value: (enemy.type === 'enemy5' || enemy.type === 'enemy6') ? 5 : 1, radius: 10 });
    }
    for (let k = 0; k < 5; k++) this.spawnParticle(enemy.pos, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }, '#555', Math.random() * 4 + 2, 0.5);
  }

  checkLevelUp() {
    if (this.player.xp >= this.player.xpToNext) {
      this.player.xp -= this.player.xpToNext; this.player.level++; this.player.xpToNext = Math.floor(this.player.xpToNext * 1.5);
      this.state = 'levelup'; this.callbacks.onStateChange(this.state); this.pause();
      this.callbacks.onLevelUp(this.generateUpgrades());
    }
  }

  generateUpgrades(): UpgradeOption[] {
    const allUpgrades: UpgradeOption[] = [
      { id: 'exclusive_dmg', title: 'Sharper Weapon', description: 'Main Weapon Damage +20%', icon: 'pickaxe' },
      { id: 'exclusive_size', title: 'Longer Reach', description: 'Main Weapon Radius +20%', icon: 'maximize' },
      { id: 'stone_dmg', title: 'Heavy Stones', description: 'Stone Damage +20%', icon: 'zap' },
      { id: 'stone_speed', title: 'Fast Throw', description: 'Stone Fire Rate +20%', icon: 'zap' },
      { id: 'cone_unlock', title: 'Traffic Cones', description: 'Unlock/Upgrade Cones', icon: 'cone' },
      { id: 'pie_unlock', title: 'Meat Pies', description: 'Unlock/Upgrade Meat Pies', icon: 'pie' },
      { id: 'player_speed', title: 'Work Boots', description: 'Move Speed +10%', icon: 'wind' },
      { id: 'player_hp', title: 'Tough Skin', description: 'Max HP +20 & Heal 20', icon: 'heart' },
    ];
    return allUpgrades.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  applyUpgrade(id: string) {
    switch (id) {
      case 'exclusive_dmg': this.weapons.exclusive.damage *= 1.2; break;
      case 'exclusive_size': this.weapons.exclusive.radius *= 1.2; break;
      case 'stone_dmg': this.weapons.stone.damage *= 1.2; break;
      case 'stone_speed': this.weapons.stone.fireRate *= 0.8; break;
      case 'cone_unlock': this.weapons.cones.level++; this.weapons.cones.damage *= 1.2; this.weapons.cones.fireRate *= 0.9; break;
      case 'pie_unlock': this.weapons.pies.level++; this.weapons.pies.damage *= 1.2; this.weapons.pies.fireRate *= 0.9; break;
      case 'player_speed': this.player.speed *= 1.1; break;
      case 'player_hp': this.player.maxHp += 20; this.player.hp += 20; break;
    }
    this.updateStats(); this.state = 'playing'; this.callbacks.onStateChange(this.state); this.resume();
  }

  updateStats() {
    this.callbacks.onStatsChange({
      hp: Math.ceil(this.player.hp), maxHp: this.player.maxHp, level: this.player.level,
      xp: this.player.xp, xpToNext: this.player.xpToNext, time: Math.floor(this.time),
      gems: this.player.gems, pies: this.player.pies
    });
  }

  getDist(p1: Vector2, p2: Vector2) { return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2); }

  drawSprite(spriteName: string, x: number, y: number, frame: number = 0, scale: number = 1) {
    if (!this.spritesLoaded) return false;
    const s = SPRITES[spriteName];
    if (!s) return false;
    
    const currentFrame = s.frames ? Math.floor(frame * (s.speed || 10)) % s.frames : 0;
    const sx = s.x + currentFrame * s.w;
    
    this.ctx.drawImage(this.spriteSheet, sx, s.y, s.w, s.h, x - (s.w * scale) / 2, y - (s.h * scale) / 2, s.w * scale, s.h * scale);
    return true;
  }

  drawDavoSprite(x: number, y: number, scale: number = 1) {
    if (!this.davoSpritesLoaded) return false;
    
    if (this.isSingleImageDavo) {
      const bob = this.player.isMoving ? Math.sin(this.player.frame * 2) * 5 : 0;
      const maxDim = 128 * scale;
      const imgW = this.davoSpriteSheet.width;
      const imgH = this.davoSpriteSheet.height;
      const aspect = imgW / imgH;
      
      let drawW = maxDim;
      let drawH = maxDim;
      
      if (imgW > imgH) {
        drawH = maxDim / aspect;
      } else {
        drawW = maxDim * aspect;
      }
      
      this.ctx.save();
      this.ctx.translate(x, y + bob);
      
      if (this.player.hp <= 0) {
        this.ctx.rotate(Math.PI / 2); // Lie down if dead
      } else if (this.player.facing === 'left') {
        this.ctx.scale(-1, 1); // Flip horizontally
      }
      
      this.ctx.drawImage(this.davoSpriteSheet, -drawW / 2, -drawH / 2, drawW, drawH);
      this.ctx.restore();
      return true;
    }

    // The sprite sheet has 10 columns and 5 rows.
    const cols = 10;
    const rows = 5;
    const cellW = this.davoSpriteSheet.width / cols;
    const cellH = this.davoSpriteSheet.height / rows;
    
    let col = 0;
    let row = 0;
    
    // Map facing direction to row index
    // Row 0: Down, Row 1: Right, Row 2: Left, Row 3: Up
    const dirMap: Record<string, number> = { 'down': 0, 'right': 1, 'left': 2, 'up': 3 };
    const dirRow = dirMap[this.player.facing] || 0;
    
    if (this.player.hp <= 0) {
      // Damage and Death (row 4, col 8 and 9)
      col = 9; // Dead frame (lying down)
      row = 4;
    } else if (this.player.isAttacking) {
      // Attack block: cols 4 to 7
      const frame = Math.floor(this.player.frame) % 4;
      col = 4 + frame;
      row = dirRow;
    } else if (this.player.isMoving) {
      // Walking block: cols 0 to 3
      const frame = Math.floor(this.player.frame) % 4;
      col = frame;
      row = dirRow;
    } else {
      // Idle block: cols 8 to 9
      const frame = Math.floor(this.player.frame) % 2;
      col = 8 + frame;
      row = dirRow;
    }
    
    const sx = col * cellW;
    const sy = row * cellH;
    
    this.ctx.drawImage(this.davoSpriteSheet, sx, sy, cellW, cellH, x - (cellW * scale) / 2, y - (cellH * scale) / 2, cellW * scale, cellH * scale);
    return true;
  }

  draw() {
    const { ctx, canvas, camera } = this;
    
    if (this.groundTextureLoaded && this.groundPattern) {
      const scale = 0.3; // Adjust this value to make the texture smaller or larger
      const scaledWidth = this.groundTexture.width * scale;
      const scaledHeight = this.groundTexture.height * scale;
      
      ctx.save();
      
      // Apply scale to the pattern
      const matrix = new DOMMatrix().scale(scale, scale);
      this.groundPattern.setTransform(matrix);

      // Translate pattern to match camera movement for a seamless scrolling effect
      ctx.translate(-camera.x % scaledWidth, -camera.y % scaledHeight);
      ctx.fillStyle = this.groundPattern;
      
      // Fill a rectangle slightly larger than the canvas to cover the translation offsets
      ctx.fillRect(
        -scaledWidth, 
        -scaledHeight, 
        canvas.width + scaledWidth * 2, 
        canvas.height + scaledHeight * 2
      );
      ctx.restore();
    } else {
      // Background Pit fallback
      ctx.fillStyle = '#b34d36'; // Dirt color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw props
    for (const prop of this.props) {
      // Only draw if within screen bounds (culling)
      if (
        prop.pos.x > camera.x - 200 && prop.pos.x < camera.x + canvas.width + 200 &&
        prop.pos.y > camera.y - 200 && prop.pos.y < camera.y + canvas.height + 200
      ) {
        if (this.propsLoaded[prop.type]) {
          const img = this.propImages[prop.type];
          const w = img.width * prop.scale;
          const h = img.height * prop.scale;
          ctx.drawImage(img, prop.pos.x - w / 2, prop.pos.y - h / 2, w, h);
        } else {
          // Placeholder if image not loaded
          ctx.fillStyle = ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.6)'][prop.type];
          ctx.beginPath();
          ctx.arc(prop.pos.x, prop.pos.y, 20 * prop.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Pit walls (fake 3D effect based on camera)
    ctx.fillStyle = '#8a3324';
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    ctx.lineTo(camera.x + canvas.width, camera.y);
    ctx.lineTo(camera.x + canvas.width, camera.y + 100);
    ctx.lineTo(camera.x, camera.y + 100);
    ctx.fill();
    ctx.strokeStyle = '#6b2418';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw Collectibles
    for (const c of this.collectibles) {
      ctx.save(); ctx.translate(c.pos.x, c.pos.y);
      
      let drawn = false;
      if (c.type === 'gem_blue' || c.type === 'gem_green') {
        if (this.gemLoaded) {
          const scale = 0.12;
          ctx.drawImage(this.gemImage, -this.gemImage.width * scale / 2, -this.gemImage.height * scale / 2, this.gemImage.width * scale, this.gemImage.height * scale);
          drawn = true;
        }
      } else if (c.type === 'pie') {
        if (this.pieLoaded) {
          const scale = 0.3;
          ctx.drawImage(this.pieImage, -this.pieImage.width * scale / 2, -this.pieImage.height * scale / 2, this.pieImage.width * scale, this.pieImage.height * scale);
          drawn = true;
        }
      } else if (c.type === 'beer') {
        if (this.redbullLoaded) {
          const scale = 0.3;
          ctx.drawImage(this.redbullImage, -this.redbullImage.width * scale / 2, -this.redbullImage.height * scale / 2, this.redbullImage.width * scale, this.redbullImage.height * scale);
          drawn = true;
        }
      } else if (c.type === 'magnet') {
        if (this.pickLoaded) {
          const scale = 0.3;
          ctx.drawImage(this.pickImage, -this.pickImage.width * scale / 2, -this.pickImage.height * scale / 2, this.pickImage.width * scale, this.pickImage.height * scale);
          drawn = true;
        }
      }

      if (!drawn) {
        const scale = c.type === 'pie' ? 0.15 : 0.5;
        if (!this.drawSprite(c.type, 0, 0, 0, scale)) {
          if (c.type === 'pie') {
            ctx.scale(0.5, 0.5);
            ctx.fillStyle = '#d2a679'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#a64dff'; ctx.beginPath(); ctx.ellipse(0, -2, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); // Meat filling
            ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; ctx.stroke();
          } else if (c.type === 'beer') {
            // Draw beer bottle
            ctx.shadowBlur = 10; ctx.shadowColor = '#f1c40f';
            ctx.fillStyle = '#8b4513'; ctx.fillRect(-5, -8, 10, 18); // body
            ctx.fillStyle = '#deb887'; ctx.fillRect(-2, -14, 4, 6); // neck
            ctx.fillStyle = '#fff'; ctx.fillRect(-5, -4, 10, 6); // label
            ctx.shadowBlur = 0;
          } else if (c.type === 'coffee') {
            // Draw coffee cup
            ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
            ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(8, -10); ctx.lineTo(6, 10); ctx.lineTo(-6, 10); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#6f4e37'; ctx.fillRect(-5, -7, 10, 3); // coffee
            ctx.shadowBlur = 0;
          } else if (c.type === 'magnet') {
            // Draw U-magnet
            ctx.shadowBlur = 10; ctx.shadowColor = '#3498db';
            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, 0); ctx.stroke();
            ctx.fillStyle = '#bdc3c7'; ctx.fillRect(-13, 0, 6, 6); ctx.fillRect(7, 0, 6, 6);
            ctx.shadowBlur = 0;
          } else if (c.type === 'dynamite') {
            // Draw dynamite stick
            ctx.shadowBlur = 10; ctx.shadowColor = '#e67e22';
            ctx.fillStyle = '#c0392b'; ctx.fillRect(-6, -12, 12, 24);
            ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -18); ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (c.type === 'mystery_box') {
            // Draw mystery box
            ctx.shadowBlur = 15; ctx.shadowColor = '#9b59b6';
            ctx.fillStyle = '#8e44ad'; ctx.fillRect(-10, -10, 20, 20);
            ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2; ctx.strokeRect(-10, -10, 20, 20);
            ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText('?', 0, 5);
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = c.type === 'gem_blue' ? '#00ccff' : '#00ff00';
            ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath();
            ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // Draw Enemies
    for (const enemy of this.enemies) {
      ctx.save(); ctx.translate(enemy.pos.x, enemy.pos.y);
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, enemy.radius, enemy.radius, enemy.radius * 0.4, 0, 0, Math.PI * 2); ctx.fill();

      if (enemy.type === 'enemy0' && this.flySpritesLoaded) {
        const bob = Math.sin(enemy.frame) * 5;
        ctx.translate(0, bob);
        
        // Draw the custom fly image
        const scale = 0.5; // Adjust scale as needed
        const imgW = this.flySpriteSheet.width * scale;
        const imgH = this.flySpriteSheet.height * scale;
        
        // Flip if moving left
        if (enemy.knockback.x < 0 || (enemy.knockback.x === 0 && this.player.pos.x < enemy.pos.x)) {
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(this.flySpriteSheet, -imgW / 2, -imgH / 2, imgW, imgH);
      } else {
        // Determine enemy index (0 to 5)
        const enemyIndex = parseInt(enemy.type.replace('enemy', '')) - 1;
        
        if (this.enemiesLoaded[enemyIndex]) {
          const img = this.enemyImages[enemyIndex];
          const scale = (enemy.radius * 2.5) / Math.max(img.width, img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          
          const bob = Math.sin(enemy.frame) * 5;
          ctx.translate(0, bob - 10);
          
          if (enemy.knockback.x < 0 || (enemy.knockback.x === 0 && this.player.pos.x < enemy.pos.x)) {
            ctx.scale(-1, 1);
          }
          
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else if (!this.drawSprite(enemy.type, 0, -10, enemy.frame, 0.8)) {
          // Fallback drawing if image not loaded
          const bob = Math.sin(enemy.frame) * 5;
          ctx.translate(0, bob - 10);
          
          const colors = ['#556b2f', '#8b4513', '#ff4500', '#4b0082', '#2e8b57', '#800000', '#000000'];
          ctx.fillStyle = colors[enemyIndex];
          ctx.beginPath(); ctx.ellipse(0, 0, enemy.radius, enemy.radius * 1.2, 0, 0, Math.PI * 2); ctx.fill();
          
          // Eyes
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-enemy.radius/3, -enemy.radius/3, enemy.radius/4, 0, Math.PI*2); ctx.arc(enemy.radius/3, -enemy.radius/3, enemy.radius/4, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-enemy.radius/3, -enemy.radius/3, enemy.radius/8, 0, Math.PI*2); ctx.arc(enemy.radius/3, -enemy.radius/3, enemy.radius/8, 0, Math.PI*2); ctx.fill();
        }
      }

      // HP Bar
      if (enemy.hp < enemy.maxHp) {
        ctx.fillStyle = '#000'; ctx.fillRect(-15, -enemy.radius - 15, 30, 4);
        ctx.fillStyle = '#f00'; ctx.fillRect(-15, -enemy.radius - 15, 30 * (enemy.hp / enemy.maxHp), 4);
      }
      ctx.restore();
    }

    // Draw Player (Davo)
    ctx.save(); ctx.translate(this.player.pos.x, this.player.pos.y);
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 25, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
    
    // Exclusive Weapon Slash Aura
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, this.weapons.exclusive.radius * 0.8, this.weapons.exclusive.angle - Math.PI / 4, this.weapons.exclusive.angle + Math.PI / 4); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, 0, this.weapons.exclusive.radius * 0.8, this.weapons.exclusive.angle - Math.PI / 4, this.weapons.exclusive.angle + Math.PI / 4); ctx.stroke();

    if (!this.drawDavoSprite(0, -10, 0.8)) {
      // Body (Blue shirt, orange/white stripes)
      ctx.fillStyle = '#2b5b84'; ctx.fillRect(-15, -10, 30, 30); // Shirt
      ctx.fillStyle = '#ff6600'; ctx.fillRect(-15, -5, 30, 10); // Orange stripe
      ctx.fillStyle = '#fff'; ctx.fillRect(-15, 0, 30, 4); // White stripe
      ctx.fillStyle = '#2b5b84'; ctx.fillRect(-15, 20, 10, 15); ctx.fillRect(5, 20, 10, 15); // Legs
      ctx.fillStyle = '#fff'; ctx.fillRect(-15, 25, 10, 4); ctx.fillRect(5, 25, 10, 4); // Leg stripes
      ctx.fillStyle = '#4a3018'; ctx.fillRect(-16, 30, 12, 8); ctx.fillRect(4, 30, 12, 8); // Boots

      // Head
      ctx.fillStyle = '#f5cba7'; ctx.beginPath(); ctx.arc(0, -20, 15, 0, Math.PI * 2); ctx.fill(); // Face
      ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.arc(0, -15, 16, 0, Math.PI); ctx.fill(); // Beard
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-5, -22, 2, 0, Math.PI*2); ctx.arc(5, -22, 2, 0, Math.PI*2); ctx.fill(); // Eyes
      
      // Hard Hat
      ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(0, -25, 16, Math.PI, 0); ctx.fill();
      ctx.fillRect(-20, -25, 40, 4); // Brim
    }

    // Exclusive Weapon
    ctx.save();
    ctx.rotate(this.weapons.exclusive.angle);
    const wRadius = this.weapons.exclusive.radius;
    
    if (this.player.characterId === 'bigkev') {
      // Tire
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(wRadius * 0.6, 0, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(wRadius * 0.6, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(wRadius * 0.6, 0, 6, 0, Math.PI * 2); ctx.fill();
    } else if (this.player.characterId === 'kev') {
      // Cone
      ctx.translate(wRadius * 0.6, 0); ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#ff6600'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(10, 15); ctx.lineTo(-10, 15); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(7, 5); ctx.lineTo(-7, 5); ctx.fill();
    } else if (this.player.characterId === 'shazza') {
      // Pan
      ctx.fillStyle = '#222'; ctx.fillRect(15, -2, wRadius * 0.4, 4); // Handle
      ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(wRadius * 0.6, 0, 12, 0, Math.PI * 2); ctx.fill(); // Pan body
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(wRadius * 0.6, 0, 10, 0, Math.PI * 2); ctx.fill(); // Pan inner
    } else if (this.player.characterId === 'steve') {
      // Book
      ctx.fillStyle = '#8b0000'; ctx.fillRect(wRadius * 0.5, -10, 20, 20); // Cover
      ctx.fillStyle = '#fff'; ctx.fillRect(wRadius * 0.5 + 2, -8, 16, 16); // Pages
      ctx.fillStyle = '#000'; ctx.fillRect(wRadius * 0.5 + 4, -4, 10, 2); ctx.fillRect(wRadius * 0.5 + 4, 2, 10, 2); // Text lines
    } else {
      // Pickaxe (Dave / Default)
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(15, -2, wRadius * 0.5, 4); // Handle
      ctx.fillStyle = '#777'; ctx.beginPath(); ctx.moveTo(wRadius * 0.6, -15); ctx.lineTo(wRadius * 0.6 + 5, 0); ctx.lineTo(wRadius * 0.6, 15); ctx.lineTo(wRadius * 0.6 - 5, 0); ctx.fill(); // Head
    }
    ctx.restore();

    ctx.restore();

    // Draw Projectiles
    for (const p of this.projectiles) {
      ctx.save(); ctx.translate(p.pos.x, p.pos.y); ctx.rotate(p.rotation);
      const scale = p.type === 'pie' ? 0.15 : 0.5;
      if (!this.drawSprite(p.type, 0, 0, 0, scale)) {
        if (p.type === 'cone') {
          ctx.fillStyle = '#ff6600'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(10, 15); ctx.lineTo(-10, 15); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(7, 5); ctx.lineTo(-7, 5); ctx.fill();
        } else if (p.type === 'pie') {
          ctx.scale(0.5, 0.5);
          ctx.fillStyle = '#d2a679'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#a64dff'; ctx.beginPath(); ctx.ellipse(0, -2, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; ctx.stroke();
        } else if (p.type === 'stone') {
          ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(-2, -2, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    // Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();

    // Draw Joystick
    if (this.touchActive) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen space
      
      const baseRadius = 60;
      const stickRadius = 30;
      
      // Base
      ctx.beginPath();
      ctx.arc(this.touchStart.x, this.touchStart.y, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Stick
      const dx = this.touchCurrent.x - this.touchStart.x;
      const dy = this.touchCurrent.y - this.touchStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const moveX = dist > baseRadius ? (dx / dist) * baseRadius : dx;
      const moveY = dist > baseRadius ? (dy / dist) * baseRadius : dy;
      
      ctx.beginPath();
      ctx.arc(this.touchStart.x + moveX, this.touchStart.y + moveY, stickRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    }
  }
}
