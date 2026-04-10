/* ============================================================
   effects.js — Extra Visual Effects
   fireworks / screen-flash / glitch / shooting stars / shake
   ============================================================ */
window.FXEngine = (() => {

  /* ── FIREWORKS ── */
  let fwCanvas, fwCtx, fwParticles = [], fwRunning = false;

  function initFireworks() {
    fwCanvas = document.createElement('canvas');
    fwCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99;';
    document.body.appendChild(fwCanvas);
    resizeFW();
    window.addEventListener('resize', resizeFW);
    fwCtx = fwCanvas.getContext('2d');
  }

  function resizeFW() {
    if (fwCanvas) { fwCanvas.width = window.innerWidth; fwCanvas.height = window.innerHeight; }
  }

  function launchFirework(x, y) {
    if (!fwCanvas) initFireworks();
    const colors = ['#FFD700','#FF2D55','#007AFF','#FF85A2','#a78bfa','#34d399','#fb923c'];
    const count = 60 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 3 + Math.random() * 6;
      fwParticles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3, life: 1,
        decay: 0.012 + Math.random() * 0.012,
        trail: [], gravity: 0.08,
      });
    }
    if (!fwRunning) animFW();
    if (window.SoundEngine) SoundEngine.playFirework();
  }

  function burstFireworks(count = 3) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const x = window.innerWidth * (0.2 + Math.random() * 0.6);
        const y = window.innerHeight * (0.1 + Math.random() * 0.5);
        launchFirework(x, y);
      }, i * 280);
    }
  }

  function animFW() {
    fwRunning = true;
    fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
    fwParticles = fwParticles.filter(p => p.life > 0.01);
    fwParticles.forEach(p => {
      p.trail.push({ x: p.x, y: p.y, life: p.life });
      if (p.trail.length > 5) p.trail.shift();
      p.x += p.vx; p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97; p.vy *= 0.97;
      p.life -= p.decay;
      // trail
      p.trail.forEach((t, i) => {
        fwCtx.save();
        fwCtx.globalAlpha = (t.life * (i / p.trail.length)) * 0.5;
        fwCtx.fillStyle = p.color;
        fwCtx.beginPath();
        fwCtx.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2);
        fwCtx.fill();
        fwCtx.restore();
      });
      // head
      fwCtx.save();
      fwCtx.globalAlpha = p.life;
      fwCtx.fillStyle = p.color;
      fwCtx.shadowBlur = 8; fwCtx.shadowColor = p.color;
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fwCtx.fill();
      fwCtx.restore();
    });
    if (fwParticles.length > 0) requestAnimationFrame(animFW);
    else fwRunning = false;
  }

  /* ── SCREEN FLASH ── */
  let flashEl = null;
  function initFlash() {
    flashEl = document.createElement('div');
    flashEl.style.cssText = 'position:fixed;inset:0;background:white;pointer-events:none;z-index:500;opacity:0;transition:opacity 0.05s;';
    document.body.appendChild(flashEl);
  }

  function screenFlash(color = 'white', duration = 120) {
    if (!flashEl) initFlash();
    flashEl.style.background = color;
    flashEl.style.opacity = '0.85';
    flashEl.style.transition = 'opacity 0.05s';
    setTimeout(() => {
      flashEl.style.transition = `opacity ${duration}ms ease`;
      flashEl.style.opacity = '0';
    }, 50);
  }

  /* ── SCREEN SHAKE ── */
  function screenShake(intensity = 8, duration = 400) {
    const el = document.documentElement;
    const start = Date.now();
    function shake() {
      const elapsed = Date.now() - start;
      if (elapsed > duration) { el.style.transform = ''; return; }
      const progress = elapsed / duration;
      const amp = intensity * (1 - progress);
      const dx = (Math.random() - 0.5) * amp * 2;
      const dy = (Math.random() - 0.5) * amp * 2;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(shake);
    }
    requestAnimationFrame(shake);
  }

  /* ── SHOOTING STARS ── */
  let ssCanvas, ssCtx, ssStars = [], ssRunning = false;

  function initShootingStars() {
    ssCanvas = document.createElement('canvas');
    ssCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    document.body.insertBefore(ssCanvas, document.body.firstChild);
    ssCanvas.width = window.innerWidth; ssCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => { ssCanvas.width = window.innerWidth; ssCanvas.height = window.innerHeight; });
    ssCtx = ssCanvas.getContext('2d');
    spawnShootingStars();
  }

  function spawnShootingStars() {
    setInterval(() => {
      if (Math.random() < 0.5) {
        ssStars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight * 0.5,
          len: 80 + Math.random() * 120,
          speed: 8 + Math.random() * 14,
          angle: 0.4 + Math.random() * 0.3,
          life: 1,
        });
        if (!ssRunning) animSS();
      }
    }, 1200);
  }

  function animSS() {
    ssRunning = true;
    ssCtx.clearRect(0, 0, ssCanvas.width, ssCanvas.height);
    ssStars = ssStars.filter(s => s.life > 0.01);
    ssStars.forEach(s => {
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.life -= 0.025;
      const grad = ssCtx.createLinearGradient(
        s.x, s.y, s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len
      );
      grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ssCtx.save();
      ssCtx.globalAlpha = s.life;
      ssCtx.strokeStyle = grad;
      ssCtx.lineWidth = 2;
      ssCtx.beginPath();
      ssCtx.moveTo(s.x, s.y);
      ssCtx.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len);
      ssCtx.stroke();
      ssCtx.restore();
    });
    if (ssStars.length > 0 || true) requestAnimationFrame(animSS); // keep running
    else ssRunning = false;
  }

  /* ── GLITCH TEXT ── */
  function addGlitch(el) {
    el.classList.add('fx-glitch');
    el.setAttribute('data-text', el.textContent);
  }

  /* ── LASER RAYS (opening) ── */
  let laserEl = null;
  function showLasers(duration = 2000) {
    if (laserEl) { laserEl.remove(); laserEl = null; }
    laserEl = document.createElement('div');
    laserEl.className = 'fx-lasers';
    for (let i = 0; i < 8; i++) {
      const ray = document.createElement('div');
      ray.className = 'fx-laser-ray';
      ray.style.setProperty('--angle', `${i * 45}deg`);
      ray.style.animationDelay = `${i * 0.06}s`;
      laserEl.appendChild(ray);
    }
    document.body.appendChild(laserEl);
    setTimeout(() => { if (laserEl) { laserEl.style.opacity = '0'; setTimeout(() => laserEl && laserEl.remove(), 600); } }, duration);
  }

  /* ── PUBLIC API ── */
  function initAll() {
    initFireworks();
    initShootingStars();
    initFlash();
    injectGlitchCSS();
  }

  function injectGlitchCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* GLITCH */
      .fx-glitch { position: relative; }
      .fx-glitch::before, .fx-glitch::after {
        content: attr(data-text);
        position: absolute; top: 0; left: 0; width: 100%;
        background: transparent;
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .fx-glitch::before {
        animation: glitch-1 3s infinite steps(1);
        clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
        color: #ff2d55; -webkit-text-fill-color: #ff2d55;
        text-shadow: -3px 0 #ff2d55;
      }
      .fx-glitch::after {
        animation: glitch-2 3s infinite steps(1);
        clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
        color: #007aff; -webkit-text-fill-color: #007aff;
        text-shadow: 3px 0 #007aff;
      }
      @keyframes glitch-1 {
        0%,80%,100% { transform: none; opacity: 0; }
        81% { transform: translateX(-4px) skewX(-1deg); opacity: 0.8; }
        83% { transform: translateX(4px); opacity: 0.6; }
        85% { transform: translateX(-2px); opacity: 0.9; }
        87% { transform: none; opacity: 0; }
      }
      @keyframes glitch-2 {
        0%,84%,100% { transform: none; opacity: 0; }
        85% { transform: translateX(4px) skewX(1deg); opacity: 0.7; }
        87% { transform: translateX(-3px); opacity: 0.8; }
        89% { transform: none; opacity: 0; }
      }

      /* LASERS */
      .fx-lasers {
        position: fixed; top: 50%; left: 50%;
        pointer-events: none; z-index: 50;
        transition: opacity 0.6s;
      }
      .fx-laser-ray {
        position: absolute;
        width: 3px; height: 60vh;
        background: linear-gradient(to bottom, rgba(255,215,0,0.9), transparent);
        transform-origin: top center;
        transform: rotate(var(--angle));
        animation: laser-pulse 0.4s ease-in-out infinite alternate;
        border-radius: 2px;
        box-shadow: 0 0 12px #FFD700, 0 0 24px rgba(255,215,0,0.4);
      }
      @keyframes laser-pulse { from { opacity: 0.3; } to { opacity: 1; } }

      /* SECTION GLOW ON VISIBLE */
      .reveal.visible { filter: none; }

      /* NEON FLICKER on .neon-flicker class */
      .neon-flicker {
        animation: neon-f 4s infinite;
      }
      @keyframes neon-f {
        0%,19%,21%,23%,25%,54%,56%,100% {
          text-shadow: 0 0 20px var(--gold), 0 0 50px var(--gold), 0 0 80px var(--gold-deep);
        }
        20%,22%,24%,55% {
          text-shadow: none;
        }
      }

      /* RAINBOW BORDER pulse on #opening */
      #opening::before {
        content: '';
        position: absolute;
        inset: 0;
        background: conic-gradient(from 0deg, #ff2d55, #ff9500, #ffd700, #34d399, #007aff, #a78bfa, #ff2d55);
        opacity: 0;
        animation: rainbow-pulse 3s ease-in-out infinite;
        pointer-events: none;
        z-index: 0;
        border-radius: 0;
      }
      #opening > * { position: relative; z-index: 1; }
      @keyframes rainbow-pulse {
        0%,100% { opacity: 0; }
        50% { opacity: 0.06; }
      }

      /* SCANLINES overlay */
      body::after {
        content: '';
        position: fixed; inset: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent, transparent 2px,
          rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
        );
        pointer-events: none;
        z-index: 400;
      }
    `;
    document.head.appendChild(style);
  }

  return { initAll, burstFireworks, launchFirework, screenFlash, screenShake, showLasers, addGlitch };
})();
