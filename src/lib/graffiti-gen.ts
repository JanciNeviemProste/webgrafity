export const DESIGN_LABELS = ['DREAM BIG', 'CREATE', 'PEACE', 'FLOW', 'LIBRE'];
export const DESIGN_COLORS = ['#ff006e', '#00f5d4', '#e94560', '#e76f51', '#8338ec'];

export function generateGraffiti(index: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 800;
  c.height = 500;
  const ctx = c.getContext('2d')!;

  const designs: (() => void)[] = [
    // 0: DREAM BIG
    () => {
      const grad = ctx.createLinearGradient(0, 0, 800, 500);
      grad.addColorStop(0, '#ff006e');
      grad.addColorStop(0.3, '#fb5607');
      grad.addColorStop(0.6, '#ffbe0b');
      grad.addColorStop(1, '#8338ec');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 500);

      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * 800,
          Math.random() * 500,
          Math.random() * 40 + 5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.save();
      ctx.translate(400, 280);
      ctx.rotate(-0.08);
      ctx.font = "bold 120px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 8;
      ctx.strokeText('DREAM', 0, 0);
      ctx.fillStyle = '#fff';
      ctx.fillText('DREAM', 0, 0);
      ctx.font = "bold 50px 'Arial Black', Impact, sans-serif";
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('BIG', 0, 65);
      ctx.fillStyle = '#ffbe0b';
      ctx.fillText('BIG', 0, 65);
      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 500;
        ctx.fillRect(x, y, 2, 2);
      }

      for (let d = 0; d < 5; d++) {
        const dx = 150 + Math.random() * 500;
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,110' : '131,56,236'},0.6)`;
        for (let y = 300; y < 500; y += 3) {
          ctx.fillRect(dx + Math.sin(y * 0.05) * 3, y, 4, 4);
        }
      }
    },

    // 1: CREATE
    () => {
      ctx.fillStyle = '#0a0a2e';
      ctx.fillRect(0, 0, 800, 500);
      const colors = ['#00f5d4', '#00bbf9', '#fee440', '#f15bb5', '#9b5de5'];
      for (let i = 0; i < 15; i++) {
        ctx.save();
        ctx.translate(100 + Math.random() * 600, 50 + Math.random() * 400);
        ctx.rotate(Math.random() * Math.PI);
        const size = 30 + Math.random() * 100;
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        const sides = 3 + Math.floor(Math.random() * 4);
        ctx.beginPath();
        for (let s = 0; s <= sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const px = Math.cos(a) * size;
          const py = Math.sin(a) * size;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(400, 250);
      ctx.font = "bold 90px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tGrad = ctx.createLinearGradient(-200, 0, 200, 0);
      tGrad.addColorStop(0, '#00f5d4');
      tGrad.addColorStop(0.5, '#fee440');
      tGrad.addColorStop(1, '#f15bb5');
      ctx.fillStyle = tGrad;
      ctx.fillText('CREATE', 0, -20);
      ctx.font = "32px 'Arial Black', Impact, sans-serif";
      ctx.fillStyle = '#00bbf9';
      ctx.fillText('\u2605  YOUR  WORLD  \u2605', 0, 40);
      ctx.restore();
    },

    // 2: PEACE
    () => {
      const grad = ctx.createRadialGradient(400, 250, 50, 400, 250, 400);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(0.5, '#16213e');
      grad.addColorStop(1, '#0f3460');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 500);

      ctx.save();
      ctx.translate(400, 250);
      for (let ring = 0; ring < 6; ring++) {
        const r = 40 + ring * 35;
        const n = 8 + ring * 4;
        ctx.strokeStyle = `hsl(${ring * 50 + 180}, 80%, 60%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2 + ring * 0.2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();

      ctx.font = "bold 60px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e94560';
      ctx.fillText('PEACE', 400, 430);

      const symbol = (cx: number, cy: number, r: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx, cy + r);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - r * 0.6, cy + r * 0.6);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * 0.6, cy + r * 0.6);
        ctx.stroke();
      };
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 3;
      symbol(400, 250, 50);
    },

    // 3: FLOW
    () => {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 800, 500);
      const cols = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'];
      for (let w = 0; w < 12; w++) {
        const x = 30 + w * 65;
        const amplitude = 40 + Math.random() * 60;
        const freq = 0.01 + Math.random() * 0.02;
        const offset = Math.random() * 100;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y <= 500; y += 2) {
          ctx.lineTo(x + Math.sin((y + offset) * freq) * amplitude, y);
        }
        ctx.strokeStyle = cols[w % cols.length];
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.7;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(400, 250);
      ctx.rotate(-0.05);
      ctx.font = "bold 100px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#264653';
      ctx.fillText('FLOW', 3, 3);
      ctx.fillStyle = '#e76f51';
      ctx.fillText('FLOW', 0, 0);
      ctx.restore();
    },

    // 4: LIBRE
    () => {
      ctx.fillStyle = '#1b1b2f';
      ctx.fillRect(0, 0, 800, 500);
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `hsla(${Math.random() * 360}, 90%, 60%, 0.5)`;
        const x = Math.random() * 800;
        const y = Math.random() * 500;
        const r = 5 + Math.random() * 50;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        for (let s = 0; s < 20; s++) {
          const sx = x + (Math.random() - 0.5) * r * 3;
          const sy = y + (Math.random() - 0.5) * r * 3;
          ctx.fillRect(sx, sy, 2, 2);
        }
      }
      ctx.save();
      ctx.translate(400, 260);
      ctx.font = "bold 110px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText('LIBRE', 0, 0);
      ctx.fillStyle = 'transparent';
      ctx.fillText('LIBRE', 0, 0);
      ctx.font = "24px 'Arial Black', Impact, sans-serif";
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('STREET  ART  IS  NOT  A  CRIME', 0, 65);
      ctx.restore();
    },
  ];

  designs[index % designs.length]();
  return c;
}

export function generateWall(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 600;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#b8a99a';
  ctx.fillRect(0, 0, 900, 600);

  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(${120 + Math.random() * 40},${100 + Math.random() * 40},${80 + Math.random() * 40},0.3)`;
    ctx.fillRect(
      Math.random() * 900,
      Math.random() * 600,
      Math.random() * 4 + 1,
      Math.random() * 4 + 1
    );
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 600; y += 30) {
    const offset = (Math.floor(y / 30) % 2) * 45;
    for (let x = offset; x < 900; x += 90) {
      ctx.strokeRect(x + 1, y + 1, 88, 28);
      ctx.fillStyle = `rgba(${160 + Math.random() * 30},${140 + Math.random() * 30},${120 + Math.random() * 30},0.15)`;
      ctx.fillRect(x + 1, y + 1, 88, 28);
    }
  }

  const vignette = ctx.createRadialGradient(450, 300, 100, 450, 300, 500);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 900, 600);

  return c;
}
