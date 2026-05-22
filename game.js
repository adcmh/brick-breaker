// ============================================================
// 打砖块游戏 - Breakout Game
// 面向对象设计，涵盖：物理反弹、对象类设计、碰撞检测
// ============================================================

// ---------- Vector2D: 二维向量工具类 ----------
class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v)  { return new Vector2D(this.x + v.x, this.y + v.y); }
  sub(v)  { return new Vector2D(this.x - v.x, this.y - v.y); }
  scale(s){ return new Vector2D(this.x * s, this.y * s); }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / mag, this.y / mag);
  }

  dot(v) { return this.x * v.x + this.y * v.y; }
  clone(){ return new Vector2D(this.x, this.y); }
}

// ---------- Ball: 球 ----------
class Ball {
  constructor(x, y, radius, speed) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(0, 0);
    this.radius = radius;
    this.speed = speed;
    this.launched = false;
  }

  // 重置到初始位置，随机发射方向
  reset(canvasW, canvasH, paddleY) {
    this.pos = new Vector2D(canvasW / 2, paddleY - 20);
    // 随机角度：-30° ~ +30° 偏离正上方
    const angle = (Math.random() * Math.PI / 3) - Math.PI / 6 - Math.PI / 2;
    this.vel = new Vector2D(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
    this.launched = false;
  }

  launch() {
    if (!this.launched) {
      const angle = (Math.random() * Math.PI / 3) - Math.PI / 6 - Math.PI / 2;
      this.vel = new Vector2D(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      );
      this.launched = true;
    }
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
  }

  bounceX() { this.vel.x = -this.vel.x; }
  bounceY() { this.vel.y = -this.vel.y; }

  // 根据挡板击中位置重新计算速度
  reflectOffPaddle(hitOffset, maxAngleDeg) {
    const maxAngle = maxAngleDeg * Math.PI / 180;   // 最大反弹角（弧度）
    const angle = hitOffset * maxAngle;              // -maxAngle ~ +maxAngle
    this.vel = new Vector2D(
      this.speed * Math.sin(angle),
      -this.speed * Math.cos(angle)                  // 始终向上
    );
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();

    // 高光
    const gradient = ctx.createRadialGradient(
      this.pos.x - this.radius * 0.3,
      this.pos.y - this.radius * 0.3,
      0,
      this.pos.x, this.pos.y, this.radius
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.closePath();
  }
}

// ---------- Paddle: 挡板 ----------
class Paddle {
  constructor(canvasW, canvasH) {
    this.width = 120;
    this.height = 16;
    this.speed = 500;               // 像素/秒
    this.pos = new Vector2D((canvasW - this.width) / 2, canvasH - 40);
    this.canvasW = canvasW;
  }

  update(dt, keys) {
    if (keys['ArrowLeft'] || keys['KeyA']) {
      this.pos.x -= this.speed * dt;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      this.pos.x += this.speed * dt;
    }
    // 边界限制
    if (this.pos.x < 0) this.pos.x = 0;
    if (this.pos.x + this.width > this.canvasW) {
      this.pos.x = this.canvasW - this.width;
    }
  }

  // 命中偏移量：-1（左端） ~ +1（右端）
  getHitOffset(ballX) {
    const relativeX = ballX - (this.pos.x + this.width / 2);
    return Math.max(-1, Math.min(1, relativeX / (this.width / 2)));
  }

  draw(ctx) {
    const x = this.pos.x, y = this.pos.y;
    const w = this.width, h = this.height;
    const r = h / 2;

    // 圆角矩形
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    // 渐变
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#6c5ce7');
    grad.addColorStop(0.5, '#a29bfe');
    grad.addColorStop(1, '#5a4bd1');
    ctx.fillStyle = grad;
    ctx.fill();

    // 边框发光
    ctx.strokeStyle = 'rgba(162, 155, 254, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  reset(canvasW, canvasH) {
    this.pos = new Vector2D((canvasW - this.width) / 2, canvasH - 40);
  }
}

// ---------- Brick: 单个砖块 ----------
class Brick {
  constructor(x, y, w, h, color, health, points) {
    this.pos = new Vector2D(x, y);
    this.width = w;
    this.height = h;
    this.color = color;
    this.health = health;
    this.maxHealth = health;
    this.points = points;
    this.alive = true;
  }

  // 受击，返回是否被摧毁
  hit() {
    this.health--;
    if (this.health <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (!this.alive) return;

    const x = this.pos.x, y = this.pos.y;
    const w = this.width, h = this.height;

    // 主体
    ctx.fillStyle = this.health < this.maxHealth
      ? this._lightenColor(this.color, 0.5)   // 受损变亮
      : this.color;
    ctx.fillRect(x, y, w, h);

    // 顶部高光
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 2, y + 1, w - 4, h / 2 - 1);

    // 底部阴影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 2, y + h / 2, w - 4, h / 2 - 1);

    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  _lightenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lr = Math.min(255, Math.floor(r + (255 - r) * factor));
    const lg = Math.min(255, Math.floor(g + (255 - g) * factor));
    const lb = Math.min(255, Math.floor(b + (255 - b) * factor));
    return '#' + [lr, lg, lb].map(v =>
      v.toString(16).padStart(2, '0')
    ).join('');
  }
}

// ---------- BrickGrid: 砖块阵列 ----------
class BrickGrid {
  constructor(cols, rows, canvasW, canvasH) {
    this.cols = cols;
    this.rows = rows;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.bricks = [];
    this.gap = 4;
    this.paddingTop = 60;
    this.paddingSide = 30;
    this.brickH = 24;

    // 颜色映射：每行一种颜色
    this.rowColors = [
      '#ff4757', '#ff6b35', '#ffd32a', '#2ed573',
      '#1e90ff', '#a55eea', '#ff6b81', '#7bed9f'
    ];
  }

  generate(level) {
    this.bricks = [];
    const brickW = (this.canvasW - this.paddingSide * 2 - this.gap * (this.cols - 1)) / this.cols;

    // 难度递增：更高关卡有更多高血量砖块
    const healthChance = Math.min(0.15 + level * 0.08, 0.5);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = this.paddingSide + col * (brickW + this.gap);
        const y = this.paddingTop + row * (this.brickH + this.gap);
        const color = this.rowColors[row % this.rowColors.length];
        const health = Math.random() < healthChance ? 2 : 1;
        // 分数：越靠上越高
        const points = (this.rows - row) * 10 + health * 5;
        this.bricks.push(new Brick(x, y, brickW, this.brickH, color, health, points));
      }
    }
  }

  // 球与砖块碰撞检测，返回 { brick, side } 或 null
  // side: 'top'|'bottom'|'left'|'right' 指示球从哪个面碰撞
  checkCollision(ball) {
    for (const brick of this.bricks) {
      if (!brick.alive) continue;

      const bx = brick.pos.x, by = brick.pos.y;
      const bw = brick.width, bh = brick.height;

      // 找到球心到砖块矩形的最接近点
      const closestX = Math.max(bx, Math.min(ball.pos.x, bx + bw));
      const closestY = Math.max(by, Math.min(ball.pos.y, by + bh));

      const distX = ball.pos.x - closestX;
      const distY = ball.pos.y - closestY;
      const distSq = distX * distX + distY * distY;

      if (distSq < ball.radius * ball.radius) {
        // 判断碰撞面：比较球心在砖块各边的穿透深度
        const overlapLeft   = (ball.pos.x + ball.radius) - bx;
        const overlapRight  = (bx + bw) - (ball.pos.x - ball.radius);
        const overlapTop    = (ball.pos.y + ball.radius) - by;
        const overlapBottom = (by + bh) - (ball.pos.y - ball.radius);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        // 较小的穿透方向为主碰撞方向
        const side = minOverlapX < minOverlapY
          ? (overlapLeft < overlapRight ? 'left' : 'right')
          : (overlapTop < overlapBottom ? 'top' : 'bottom');

        return { brick, side };
      }
    }
    return null;
  }

  allCleared() {
    return this.bricks.every(b => !b.alive);
  }

  draw(ctx) {
    for (const brick of this.bricks) {
      brick.draw(ctx);
    }
  }
}

// ---------- Game: 游戏主控 ----------
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // 画布尺寸
    this.canvas.width = 800;
    this.canvas.height = 600;

    // 游戏对象
    this.ball = new Ball(this.canvas.width / 2, this.canvas.height - 60, 8, 350);
    this.paddle = new Paddle(this.canvas.width, this.canvas.height);
    this.brickGrid = new BrickGrid(10, 6, this.canvas.width, this.canvas.height);

    // 游戏状态
    this.state = 'START';         // START | PLAYING | PAUSED | LIFE_LOST | GAME_OVER | WIN
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.keys = {};
    this.lastTime = 0;
    this.lifeLostTimer = 0;       // 失命后的短暂等待

    // UI 元素
    this.scoreEl = document.getElementById('scoreDisplay');
    this.livesEl = document.getElementById('livesDisplay');
    this.levelEl = document.getElementById('levelDisplay');

    this._bindEvents();
    this.brickGrid.generate(this.level);
  }

  // ---- 事件绑定 ----
  _bindEvents() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state === 'START') {
          this.state = 'PLAYING';
          this.ball.launch();
        } else if (this.state === 'GAME_OVER' || this.state === 'WIN') {
          this._restart();
        } else if (this.state === 'PLAYING') {
          this.ball.launch();    // 允许手动发射
        }
      }

      if (e.code === 'KeyP' && this.state === 'PLAYING') {
        this.state = 'PAUSED';
      } else if (e.code === 'KeyP' && this.state === 'PAUSED') {
        this.state = 'PLAYING';
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    // 鼠标/触摸控制挡板
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      this.paddle.pos.x = mouseX - this.paddle.width / 2;
      // 边界修正
      if (this.paddle.pos.x < 0) this.paddle.pos.x = 0;
      if (this.paddle.pos.x + this.paddle.width > this.canvas.width) {
        this.paddle.pos.x = this.canvas.width - this.paddle.width;
      }
    });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const touchX = (e.touches[0].clientX - rect.left) * scaleX;
      this.paddle.pos.x = touchX - this.paddle.width / 2;
      if (this.paddle.pos.x < 0) this.paddle.pos.x = 0;
      if (this.paddle.pos.x + this.paddle.width > this.canvas.width) {
        this.paddle.pos.x = this.canvas.width - this.paddle.width;
      }
    }, { passive: false });

    // 点击发射
    this.canvas.addEventListener('click', () => {
      if (this.state === 'START') {
        this.state = 'PLAYING';
        this.ball.launch();
      } else if (this.state === 'PLAYING') {
        this.ball.launch();
      }
    });
  }

  // ---- 重新开始 ----
  _restart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.ball.reset(this.canvas.width, this.canvas.height, this.paddle.pos.y);
    this.paddle.reset(this.canvas.width, this.canvas.height);
    this.brickGrid.generate(this.level);
    this.state = 'PLAYING';
    this.ball.launch();
  }

  // ---- 进入下一关 ----
  _nextLevel() {
    const maxLevel = 5;
    if (this.level >= maxLevel) {
      this.state = 'WIN';
      return;
    }
    this.level++;
    this.ball.speed += 40;                             // 逐关加速
    this.brickGrid.rows = Math.min(8, this.brickGrid.rows + 1); // 逐关加行
    this.ball.reset(this.canvas.width, this.canvas.height, this.paddle.pos.y);
    this.paddle.reset(this.canvas.width, this.canvas.height);
    this.brickGrid.generate(this.level);
    this.state = 'PLAYING';
    this.ball.launch();
  }

  // ---- 失命 ----
  _loseLife() {
    this.lives--;
    if (this.lives <= 0) {
      this.state = 'GAME_OVER';
    } else {
      this.state = 'LIFE_LOST';
      this.lifeLostTimer = 1.2;  // 1.2 秒等待
    }
  }

  // ---- 主更新 ----
  update(dt) {
    if (this.state === 'LIFE_LOST') {
      this.lifeLostTimer -= dt;
      if (this.lifeLostTimer <= 0) {
        this.ball.reset(this.canvas.width, this.canvas.height, this.paddle.pos.y);
        this.paddle.reset(this.canvas.width, this.canvas.height);
        this.state = this.lives > 0 ? 'PLAYING' : 'GAME_OVER';
      }
      return;
    }

    if (this.state !== 'PLAYING') return;

    // 挡板更新（未发射时球跟随挡板）
    this.paddle.update(dt, this.keys);

    if (!this.ball.launched) {
      this.ball.pos.x = this.paddle.pos.x + this.paddle.width / 2;
      this.ball.pos.y = this.paddle.pos.y - this.ball.radius - 2;
      return;
    }

    // 保存旧位置用于碰撞响应
    const prevPos = this.ball.pos.clone();

    this.ball.update(dt);
    this._handleCollisions(prevPos);
    this._updateUI();
  }

  // ---- 碰撞处理 ----
  _handleCollisions(prevPos) {
    const ball = this.ball;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // --- 墙壁碰撞 ---
    // 左右墙
    if (ball.pos.x - ball.radius < 0) {
      ball.pos.x = ball.radius;
      ball.bounceX();
    } else if (ball.pos.x + ball.radius > cw) {
      ball.pos.x = cw - ball.radius;
      ball.bounceX();
    }

    // 顶墙
    if (ball.pos.y - ball.radius < 0) {
      ball.pos.y = ball.radius;
      ball.bounceY();
    }

    // 底部：失命
    if (ball.pos.y - ball.radius > ch) {
      this._loseLife();
      return;
    }

    // --- 挡板碰撞 ---
    const p = this.paddle;
    if (ball.pos.y + ball.radius >= p.pos.y &&
        ball.pos.y - ball.radius <= p.pos.y + p.height &&
        ball.pos.x + ball.radius > p.pos.x &&
        ball.pos.x - ball.radius < p.pos.x + p.width) {

      // 确保球从上方进入且向下运动
      if (ball.vel.y > 0 && prevPos.y + ball.radius <= p.pos.y + 5) {
        ball.pos.y = p.pos.y - ball.radius;
        const hitOffset = p.getHitOffset(ball.pos.x);
        ball.reflectOffPaddle(hitOffset, 60);
      }
    }

    // --- 砖块碰撞 ---
    const result = this.brickGrid.checkCollision(ball);
    if (result) {
      const { brick, side } = result;

      // 物理反弹
      if (side === 'top' || side === 'bottom') {
        ball.bounceY();
      } else {
        ball.bounceX();
      }

      // 受击处理
      const destroyed = brick.hit();
      this.score += brick.points;

      if (destroyed && this.brickGrid.allCleared()) {
        this._nextLevel();
      }
    }
  }

  // ---- UI 更新 ----
  _updateUI() {
    this.scoreEl.textContent = this.score;
    this.livesEl.textContent = this.lives;
    this.levelEl.textContent = this.level;
  }

  // ---- 渲染 ----
  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // 清屏
    ctx.clearRect(0, 0, cw, ch);

    // 绘制游戏对象
    this.brickGrid.draw(ctx);
    this.paddle.draw(ctx);
    this.ball.draw(ctx);

    // 覆盖层文字
    this._drawOverlay();
  }

  _drawOverlay() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.state === 'START') {
      this._drawOverlayBox('打 砖 块', '← → 或 A/D 移动挡板\n鼠标/触摸也可控制\n空格或点击发射小球', '#a29bfe');
    } else if (this.state === 'PAUSED') {
      this._drawOverlayBox('暂 停', '按 P 继续', '#ffd32a');
    } else if (this.state === 'GAME_OVER') {
      this._drawOverlayBox('游 戏 结 束', `最终得分: ${this.score}\n按空格重新开始`, '#ff4757');
    } else if (this.state === 'WIN') {
      this._drawOverlayBox('通 关!', `最终得分: ${this.score}\n按空格重新开始`, '#2ed573');
    } else if (this.state === 'LIFE_LOST') {
      ctx.font = '28px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ff6348';
      ctx.fillText(`剩余生命: ${this.lives}`, cw / 2, ch / 2);
    }
  }

  _drawOverlayBox(title, subtitle, color) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, cw, ch);

    // 标题
    ctx.font = 'bold 44px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(title, cw / 2, ch / 2 - 50);

    // 副标题
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ccc';
    const lines = subtitle.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, cw / 2, ch / 2 + 10 + i * 28);
    });
  }

  // ---- 游戏循环 ----
  gameLoop(timestamp) {
    if (this.lastTime === 0) this.lastTime = timestamp;
    let dt = (timestamp - this.lastTime) / 1000;  // 秒
    if (dt > 0.1) dt = 0.016;                     // 防止切后台后跳帧
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(t => this.gameLoop(t));
  }

  start() {
    this._updateUI();
    requestAnimationFrame(t => this.gameLoop(t));
  }
}

// ---- 启动 ----
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
