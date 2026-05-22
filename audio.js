// ============================================================
// AudioManager - Web Audio API 音效管理
// 所有音效均通过代码合成，无需外部音频文件
// ============================================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.bgmPlaying = false;
    this.bgmTimeout = null;
    this.muted = false;
  }

  // 延迟初始化（需用户交互后才能创建 AudioContext）
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // 主音量控制
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

    // BGM 通道
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.25;
    this.bgmGain.connect(this.masterGain);

    // 音效通道
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);
  }

  // ==================== 背景音乐 ====================
  startBGM() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this._playBGMLoop();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
  }

  toggleMute() {
    if (!this.ctx) return;
    this.muted = !this.muted;
    this.masterGain.gain.value = this.muted ? 0 : 0.3;
  }

  // 简单的循环旋律：C大调琶音
  _playBGMLoop() {
    if (!this.bgmPlaying) return;

    // 音符序列：C4 E4 G4 C5 的变奏
    const melody = [
      262, 330, 392, 523,  // C E G C5
      392, 330, 262, 247,  // G E C B3
      262, 294, 349, 392,  // C D F G
      349, 294, 262, 220,  // F D C A3
    ];

    const noteLength = 0.18;  // 每音符时长
    let time = 0;

    melody.forEach((freq) => {
      const startTime = this.ctx.currentTime + time;
      this._playNote(freq, startTime, noteLength * 0.85, 'square', this.bgmGain, 0.18);
      time += noteLength;
    });

    // 循环间隔后重新播放
    this.bgmTimeout = setTimeout(() => this._playBGMLoop(), melody.length * noteLength * 1000 + 200);
  }

  // ==================== 音效 ====================

  // 挡板反弹：短促中频音
  playPaddleBounce(hitOffset = 0) {
    this.init();
    // 偏移量影响音高，增加反馈感
    const freq = 440 + hitOffset * 120;
    this._playTone(freq, 'triangle', 0.08, 0.25);
  }

  // 墙壁反弹：较高频
  playWallBounce() {
    this.init();
    this._playTone(660, 'sine', 0.06, 0.15);
  }

  // 砖块击中（未碎）：短促金属音
  playBrickHit() {
    this.init();
    this._playNoise(0.04, 0.2);          // 短噪声
    this._playTone(1200, 'square', 0.05, 0.1); // 高频金属感
  }

  // 砖块击碎：噪声 + 下降音调
  playBrickBreak() {
    this.init();
    // 噪声层：模拟碎片声
    this._playNoise(0.12, 0.35);

    // 下降的金属音
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 失命：下降的悲伤音
  playLoseLife() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // 游戏结束
  playGameOver() {
    this.init();
    this.stopBGM();

    const notes = [392, 349, 330, 262];  // G F E C 下行
    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      this._playNote(freq, now + i * 0.2, 0.22, 'sine', this.sfxGain, 0.25);
    });
  }

  // 通关
  playWin() {
    this.init();
    this.stopBGM();

    const notes = [523, 659, 784, 1047];  // C5 E5 G5 C6 上行
    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      this._playNote(freq, now + i * 0.15, 0.2, 'triangle', this.sfxGain, 0.2);
    });
  }

  // 发射球
  playLaunch() {
    this.init();
    this._playTone(550, 'sine', 0.08, 0.12);
  }

  // ==================== 底层合成方法 ====================

  // 播放单个音调
  _playTone(freq, type, duration, volume) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  // 播放音符（指定开始时间和连接到指定节点）
  _playNote(freq, startTime, duration, type, outputNode, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(outputNode);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // 播放白噪声
  _playNoise(duration, volume) {
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    source.buffer = buffer;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(gain);
    gain.connect(this.sfxGain);

    source.start(now);
    source.stop(now + duration + 0.01);
  }
}
