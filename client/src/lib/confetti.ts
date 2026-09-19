// Lightweight HTML5 Canvas particle confetti system

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
}

export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = ['#e76f61', '#67a98f', '#e4a348', '#8a70d6', '#3b82f6', '#ec4899'];
  const particles: Particle[] = [];

  for (let i = 0; i < 75; i++) {
    particles.push({
      x: width / 2 + (Math.random() * 100 - 50),
      y: height / 2 + (Math.random() * 60 - 30),
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 6,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      alpha: 1,
    });
  }

  let animationFrame: number;
  const startTime = Date.now();

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const elapsed = (Date.now() - startTime) / 1000;
    let aliveCount = 0;

    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.4; // gravity
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      if (elapsed > 1.2) {
        p.alpha -= 0.03;
      }

      if (p.alpha > 0 && p.y < height + 50) {
        aliveCount++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }

    if (aliveCount > 0 && elapsed < 3) {
      animationFrame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrame);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  animationFrame = requestAnimationFrame(render);
}
