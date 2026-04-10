/* ============================================================
   sound.js — SoundEngine (Web Audio API, no external files)
   ============================================================ */
window.SoundEngine = (() => {
  let ctx = null;

  function init() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function master(gain = 0.5) {
    const g = ctx.createGain();
    g.gain.value = gain;
    g.connect(ctx.destination);
    return g;
  }

  /* ── ドラムロール (white noise burst) ── */
  function playDrumRoll(duration = 0.6) {
    const c = init();
    const size = Math.floor(c.sampleRate * duration);
    const buf  = c.createBuffer(1, size, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.05, c.currentTime);
    g.gain.linearRampToValueAtTime(0.35, c.currentTime + duration * 0.75);
    g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
    // high-pass filter to make it snare-like
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 800;
    src.connect(hp); hp.connect(g); g.connect(c.destination);
    src.start(); src.stop(c.currentTime + duration);
  }

  /* ── ファンファーレ (sawtooth arpeggio) ── */
  function playFanfare() {
    const c = init();
    // C-major triumphant: C4 E4 G4 C5 E5 G5
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const delay = i * 0.10;
      const osc = c.createOscillator();
      const g   = c.createGain();
      const dist = c.createWaveShaper();
      // slight distortion for brassy sound
      const curve = new Float32Array(256);
      for (let k = 0; k < 256; k++) {
        const x = (k * 2) / 256 - 1;
        curve[k] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
      }
      dist.curve = curve;
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(dist); dist.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0, c.currentTime + delay);
      g.gain.linearRampToValueAtTime(0.12, c.currentTime + delay + 0.03);
      g.gain.setValueAtTime(0.12, c.currentTime + delay + 0.25);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.55);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + 0.55);
    });
    // final big chord hit
    setTimeout(() => playChordHit(), 700);
  }

  function playChordHit() {
    const c = init();
    [261.63, 329.63, 392.00, 523.25].forEach(freq => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
      osc.start(); osc.stop(c.currentTime + 0.8);
    });
  }

  /* ── セクション登場ポップ ── */
  function playPop() {
    const c = init();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.12);
    osc.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.22, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    osc.start(); osc.stop(c.currentTime + 0.15);
  }

  /* ── カウンタ tick ── */
  let tickGain = null;
  function playTick() {
    const c = init();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.type = 'square';
    osc.frequency.value = 1200 + Math.random() * 400;
    osc.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.04, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    osc.start(); osc.stop(c.currentTime + 0.04);
  }

  /* ── 猫の鳴き声 (synthesized meow) ── */
  function playCatMeow() {
    const c = init();
    const osc  = c.createOscillator();
    const osc2 = c.createOscillator();
    const g    = c.createGain();
    // formant-ish meow contour
    osc.type  = 'sine'; osc2.type = 'sine';
    osc.frequency.setValueAtTime(480, c.currentTime);
    osc.frequency.linearRampToValueAtTime(820, c.currentTime + 0.18);
    osc.frequency.linearRampToValueAtTime(390, c.currentTime + 0.55);
    osc2.frequency.setValueAtTime(960, c.currentTime);
    osc2.frequency.linearRampToValueAtTime(1640, c.currentTime + 0.18);
    osc2.frequency.linearRampToValueAtTime(780, c.currentTime + 0.55);
    const g2 = c.createGain(); g2.gain.value = 0.3;
    osc.connect(g); osc2.connect(g2); g2.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.28, c.currentTime + 0.06);
    g.gain.setValueAtTime(0.28, c.currentTime + 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.65);
    osc.start(); osc.stop(c.currentTime + 0.65);
    osc2.start(); osc2.stop(c.currentTime + 0.65);
  }

  /* ── 花火ぼん！ ── */
  function playFirework() {
    const c = init();
    // thump
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.3);
    osc.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.4, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    osc.start(); osc.stop(c.currentTime + 0.35);
    // crackle
    const size = Math.floor(c.sampleRate * 0.15);
    const buf  = c.createBuffer(1, size, c.sampleRate);
    const d    = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const g2  = c.createGain();
    g2.gain.setValueAtTime(0.15, c.currentTime + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    src.connect(g2); g2.connect(c.destination);
    src.start(c.currentTime + 0.05); src.stop(c.currentTime + 0.2);
  }

  /* ── 🎵 BGM LOOP (triumphant epic melody) ── */
  // Notes: [frequency_hz, duration_beats]
  // Tempo: 72 BPM → 1 beat = 0.833s
  const BPM   = 72;
  const BEAT  = 60 / BPM; // 0.833s
  // Melody in C major, heroic march feel (2-bar phrase, loops)
  const MELODY = [
    // bar 1 — ascending fanfare
    [523.25, 0.5], [659.25, 0.5], [783.99, 0.5], [1046.5, 1.0],
    [880.00, 0.5], [783.99, 0.5],
    // bar 2 — resolution
    [698.46, 0.5], [587.33, 0.5], [523.25, 1.0],
    [392.00, 0.5], [523.25, 1.5],
  ];
  // Bass notes (root + fifth, one per bar)
  const BASS = [
    [130.81, 4.0], // C2 × 4 beats
    [130.81, 4.0],
  ];

  let bgmRunning  = false;
  let bgmMasterG  = null;
  let bgmTimerIds = [];

  function startBGM() {
    const c = init();
    if (bgmRunning) return;
    bgmRunning = true;

    // master volume for BGM (quiet under SFX)
    bgmMasterG = c.createGain();
    bgmMasterG.gain.setValueAtTime(0, c.currentTime);
    bgmMasterG.gain.linearRampToValueAtTime(0.18, c.currentTime + 2.0);
    bgmMasterG.connect(c.destination);

    // reverb-like convolver for space feel
    const revBuf = c.createBuffer(2, c.sampleRate * 1.5, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = revBuf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    }
    const rev = c.createConvolver();
    rev.buffer = revBuf;
    const revG = c.createGain(); revG.gain.value = 0.25;
    bgmMasterG.connect(revG); revG.connect(rev); rev.connect(c.destination);

    function scheduleLoop(startTime) {
      if (!bgmRunning) return;

      // Melody
      let t = startTime;
      MELODY.forEach(([freq, beats]) => {
        const osc = c.createOscillator();
        const g   = c.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const dur = beats * BEAT;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.55, t + 0.02);
        g.gain.setValueAtTime(0.55, t + dur * 0.6);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
        osc.connect(g); g.connect(bgmMasterG);
        osc.start(t); osc.stop(t + dur);
        t += dur;
      });

      // Bass
      let tb = startTime;
      BASS.forEach(([freq, beats]) => {
        const durB = beats * BEAT;
        [freq, freq * 1.5].forEach((f, i) => { // root + fifth
          const osc = c.createOscillator();
          const g   = c.createGain();
          osc.type = 'sine';
          osc.frequency.value = f;
          g.gain.setValueAtTime(0, tb + i * 0.05);
          g.gain.linearRampToValueAtTime(0.3, tb + i * 0.05 + 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, tb + durB * 0.85);
          osc.connect(g); g.connect(bgmMasterG);
          osc.start(tb + i * 0.05); osc.stop(tb + durB);
        });
        tb += durB;
      });

      // total loop duration
      const totalBeats = MELODY.reduce((s, [, b]) => s + b, 0);
      const loopDur    = totalBeats * BEAT * 1000; // ms
      const tid = setTimeout(() => scheduleLoop(c.currentTime), loopDur - 200);
      bgmTimerIds.push(tid);
    }

    scheduleLoop(c.currentTime + 0.1);
  }

  function stopBGM() {
    bgmRunning = false;
    bgmTimerIds.forEach(clearTimeout);
    bgmTimerIds = [];
    if (bgmMasterG) {
      const c = init();
      bgmMasterG.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
      setTimeout(() => { bgmMasterG = null; }, 600);
    }
  }

  function toggleBGM() {
    if (bgmRunning) stopBGM(); else startBGM();
    return bgmRunning;
  }

  return { init, playDrumRoll, playFanfare, playPop, playTick, playCatMeow, playFirework, startBGM, stopBGM, toggleBGM };
})();
