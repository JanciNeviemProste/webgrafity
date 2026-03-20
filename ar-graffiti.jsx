import { useState, useRef, useEffect, useCallback } from "react";

const GRID = 16;

function bilerp(c, u, v) {
  return {
    x: (1 - u) * (1 - v) * c[0].x + u * (1 - v) * c[1].x + u * v * c[2].x + (1 - u) * v * c[3].x,
    y: (1 - u) * (1 - v) * c[0].y + u * (1 - v) * c[1].y + u * v * c[2].y + (1 - u) * v * c[3].y,
  };
}

function drawTriangle(ctx, img, s0, s1, s2, d0, d1, d2) {
  const det = (s0.x - s2.x) * (s1.y - s2.y) - (s1.x - s2.x) * (s0.y - s2.y);
  if (Math.abs(det) < 0.5) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();
  const a = ((d0.x - d2.x) * (s1.y - s2.y) - (d1.x - d2.x) * (s0.y - s2.y)) / det;
  const b = ((d1.x - d2.x) * (s0.x - s2.x) - (d0.x - d2.x) * (s1.x - s2.x)) / det;
  const tx = d0.x - a * s0.x - b * s0.y;
  const c2 = ((d0.y - d2.y) * (s1.y - s2.y) - (d1.y - d2.y) * (s0.y - s2.y)) / det;
  const d2v = ((d1.y - d2.y) * (s0.x - s2.x) - (d0.y - d2.y) * (s1.x - s2.x)) / det;
  const ty = d0.y - c2 * s0.x - d2v * s0.y;
  ctx.setTransform(a, c2, b, d2v, tx, ty);
  ctx.drawImage(img, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.restore();
}

function drawPerspective(ctx, img, corners, opacity) {
  if (!img || corners.length !== 4) return;
  ctx.globalAlpha = opacity;
  const w = img.width, h = img.height;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const u0 = i / GRID, u1 = (i + 1) / GRID;
      const v0 = j / GRID, v1 = (j + 1) / GRID;
      const s00 = { x: u0 * w, y: v0 * h };
      const s10 = { x: u1 * w, y: v0 * h };
      const s01 = { x: u0 * w, y: v1 * h };
      const s11 = { x: u1 * w, y: v1 * h };
      const d00 = bilerp(corners, u0, v0);
      const d10 = bilerp(corners, u1, v0);
      const d01 = bilerp(corners, u0, v1);
      const d11 = bilerp(corners, u1, v1);
      drawTriangle(ctx, img, s00, s10, s01, d00, d10, d01);
      drawTriangle(ctx, img, s10, s11, s01, d10, d11, d01);
    }
  }
  ctx.globalAlpha = 1;
}

function generateGraffiti(index) {
  const c = document.createElement("canvas");
  c.width = 800;
  c.height = 500;
  const ctx = c.getContext("2d");
  const designs = [
    () => {
      const grad = ctx.createLinearGradient(0, 0, 800, 500);
      grad.addColorStop(0, "#ff006e");
      grad.addColorStop(0.3, "#fb5607");
      grad.addColorStop(0.6, "#ffbe0b");
      grad.addColorStop(1, "#8338ec");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 500);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 800, Math.random() * 500, Math.random() * 40 + 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(400, 280);
      ctx.rotate(-0.08);
      ctx.font = "bold 120px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 8;
      ctx.strokeText("DREAM", 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillText("DREAM", 0, 0);
      ctx.font = "bold 50px 'Arial Black', Impact, sans-serif";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.strokeText("BIG", 0, 65);
      ctx.fillStyle = "#ffbe0b";
      ctx.fillText("BIG", 0, 65);
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 800, y = Math.random() * 500;
        ctx.fillRect(x, y, 2, 2);
      }
      for (let d = 0; d < 5; d++) {
        const dx = 150 + Math.random() * 500;
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,0,110" : "131,56,236"},0.6)`;
        for (let y = 300; y < 500; y += 3) {
          ctx.fillRect(dx + Math.sin(y * 0.05) * 3, y, 4, 4);
        }
      }
    },
    () => {
      ctx.fillStyle = "#0a0a2e";
      ctx.fillRect(0, 0, 800, 500);
      const colors = ["#00f5d4", "#00bbf9", "#fee440", "#f15bb5", "#9b5de5"];
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
          const px = Math.cos(a) * size, py = Math.sin(a) * size;
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
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tGrad = ctx.createLinearGradient(-200, 0, 200, 0);
      tGrad.addColorStop(0, "#00f5d4");
      tGrad.addColorStop(0.5, "#fee440");
      tGrad.addColorStop(1, "#f15bb5");
      ctx.fillStyle = tGrad;
      ctx.fillText("CREATE", 0, -20);
      ctx.font = "32px 'Arial Black', Impact, sans-serif";
      ctx.fillStyle = "#00bbf9";
      ctx.fillText("★  YOUR  WORLD  ★", 0, 40);
      ctx.restore();
    },
    () => {
      const grad = ctx.createRadialGradient(400, 250, 50, 400, 250, 400);
      grad.addColorStop(0, "#1a1a2e");
      grad.addColorStop(0.5, "#16213e");
      grad.addColorStop(1, "#0f3460");
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
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
      ctx.font = "bold 60px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#e94560";
      ctx.fillText("PEACE", 400, 430);
      const symbol = (cx, cy, r) => {
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
      ctx.strokeStyle = "#e94560";
      ctx.lineWidth = 3;
      symbol(400, 250, 50);
    },
    () => {
      ctx.fillStyle = "#f8f9fa";
      ctx.fillRect(0, 0, 800, 500);
      const cols = ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"];
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
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.7;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(400, 250);
      ctx.rotate(-0.05);
      ctx.font = "bold 100px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#264653";
      ctx.fillText("FLOW", 3, 3);
      ctx.fillStyle = "#e76f51";
      ctx.fillText("FLOW", 0, 0);
      ctx.restore();
    },
    () => {
      ctx.fillStyle = "#1b1b2f";
      ctx.fillRect(0, 0, 800, 500);
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `hsla(${Math.random() * 360}, 90%, 60%, 0.5)`;
        const x = Math.random() * 800, y = Math.random() * 500;
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
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 3;
      ctx.strokeText("LIBRE", 0, 0);
      ctx.fillStyle = "transparent";
      ctx.fillText("LIBRE", 0, 0);
      ctx.font = "24px 'Arial Black', Impact, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("STREET  ART  IS  NOT  A  CRIME", 0, 65);
      ctx.restore();
    },
  ];
  designs[index % designs.length]();
  return c;
}

function generateWall() {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 600;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#b8a99a";
  ctx.fillRect(0, 0, 900, 600);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(${120 + Math.random() * 40},${100 + Math.random() * 40},${80 + Math.random() * 40},0.3)`;
    ctx.fillRect(Math.random() * 900, Math.random() * 600, Math.random() * 4 + 1, Math.random() * 4 + 1);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
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
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 900, 600);
  return c;
}

const LABELS = ["DREAM BIG", "CREATE", "PEACE", "FLOW", "LIBRE"];
const COLORS = ["#ff006e", "#00f5d4", "#e94560", "#e76f51", "#8338ec"];

export default function ARGraffiti() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [corners, setCorners] = useState([]);
  const [phase, setPhase] = useState("select");
  const [selectedDesign, setSelectedDesign] = useState(0);
  const [opacity, setOpacity] = useState(0.85);
  const [dragging, setDragging] = useState(-1);
  const [bgMode, setBgMode] = useState("wall");
  const [cameraError, setCameraError] = useState("");
  const graffitiRef = useRef([]);
  const wallRef = useRef(null);
  const bgImageRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    graffitiRef.current = Array.from({ length: 5 }, (_, i) => generateGraffiti(i));
    wallRef.current = generateWall();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const getCanvasPoint = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgMode === "camera" && videoRef.current && videoRef.current.readyState >= 2) {
      const v = videoRef.current;
      const vAspect = v.videoWidth / v.videoHeight;
      const cAspect = canvas.width / canvas.height;
      let sx = 0, sy = 0, sw = v.videoWidth, sh = v.videoHeight;
      if (vAspect > cAspect) {
        sw = v.videoHeight * cAspect;
        sx = (v.videoWidth - sw) / 2;
      } else {
        sh = v.videoWidth / cAspect;
        sy = (v.videoHeight - sh) / 2;
      }
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else if (bgMode === "upload" && bgImageRef.current) {
      const img = bgImageRef.current;
      const iAspect = img.width / img.height;
      const cAspect = canvas.width / canvas.height;
      let dx = 0, dy = 0, dw = canvas.width, dh = canvas.height;
      if (iAspect > cAspect) {
        dh = canvas.width / iAspect;
        dy = (canvas.height - dh) / 2;
      } else {
        dw = canvas.height * iAspect;
        dx = (canvas.width - dw) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    } else if (wallRef.current) {
      ctx.drawImage(wallRef.current, 0, 0, canvas.width, canvas.height);
    }

    if (corners.length === 4 && graffitiRef.current[selectedDesign]) {
      drawPerspective(ctx, graffitiRef.current[selectedDesign], corners, opacity);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      corners.forEach((c, i) => {
        i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    corners.forEach((c, i) => {
      const isActive = phase === "select" || dragging === i;
      ctx.beginPath();
      ctx.arc(c.x, c.y, isActive ? 14 : 10, 0, Math.PI * 2);
      ctx.fillStyle = i < 4 ? ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec"][i] : "#fff";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), c.x, c.y);
    });

    if (corners.length > 0 && corners.length < 4) {
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      corners.forEach((c, i) => {
        i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [corners, selectedDesign, opacity, bgMode, phase, dragging]);

  // Camera animation loop
  useEffect(() => {
    if (bgMode !== "camera") {
      renderFrame();
      return;
    }
    let running = true;
    const loop = () => {
      if (!running) return;
      renderFrame();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [renderFrame, bgMode]);

  // Re-render on state changes (non-camera mode)
  useEffect(() => {
    if (bgMode !== "camera") {
      renderFrame();
    }
  }, [corners, selectedDesign, opacity, renderFrame, bgMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const v = document.createElement("video");
      v.srcObject = stream;
      v.setAttribute("playsinline", "true");
      v.play();
      videoRef.current = v;
      setBgMode("camera");
      setCorners([]);
      setPhase("select");
      setCameraError("");
    } catch (err) {
      setCameraError("Kamera nie je dostupná. Použi fotku alebo demo stenu.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    videoRef.current = null;
    setBgMode("wall");
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      setBgMode("upload");
      setCorners([]);
      setPhase("select");
    };
    img.src = URL.createObjectURL(file);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e, canvas);

    if (phase === "preview" && corners.length === 4) {
      const idx = corners.findIndex(
        (c) => Math.hypot(c.x - pt.x, c.y - pt.y) < 25
      );
      if (idx >= 0) {
        setDragging(idx);
        return;
      }
    }

    if (phase === "select" && corners.length < 4) {
      const next = [...corners, pt];
      setCorners(next);
      if (next.length === 4) {
        setPhase("preview");
      }
    }
  };

  const handlePointerMove = (e) => {
    e.preventDefault();
    if (dragging < 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e, canvas);
    setCorners((prev) => prev.map((c, i) => (i === dragging ? pt : c)));
  };

  const handlePointerUp = () => setDragging(-1);

  const reset = () => {
    setCorners([]);
    setPhase("select");
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext("2d");
    
    if (bgMode === "camera" && videoRef.current && videoRef.current.readyState >= 2) {
      const v = videoRef.current;
      const vAspect = v.videoWidth / v.videoHeight;
      const cAspect = canvas.width / canvas.height;
      let sx = 0, sy = 0, sw = v.videoWidth, sh = v.videoHeight;
      if (vAspect > cAspect) { sw = v.videoHeight * cAspect; sx = (v.videoWidth - sw) / 2; }
      else { sh = v.videoWidth / cAspect; sy = (v.videoHeight - sh) / 2; }
      tCtx.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else if (bgMode === "upload" && bgImageRef.current) {
      const img = bgImageRef.current;
      const iA = img.width / img.height, cA = canvas.width / canvas.height;
      let dx = 0, dy = 0, dw = canvas.width, dh = canvas.height;
      if (iA > cA) { dh = canvas.width / iA; dy = (canvas.height - dh) / 2; }
      else { dw = canvas.height * iA; dx = (canvas.width - dw) / 2; }
      tCtx.drawImage(img, dx, dy, dw, dh);
    } else if (wallRef.current) {
      tCtx.drawImage(wallRef.current, 0, 0, canvas.width, canvas.height);
    }
    
    if (corners.length === 4 && graffitiRef.current[selectedDesign]) {
      drawPerspective(tCtx, graffitiRef.current[selectedDesign], corners, opacity);
    }
    
    const link = document.createElement("a");
    link.download = "ar-graffiti.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#fff",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 100%)",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #ff006e, #8338ec)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🎨
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.5px" }}>
              AR GRAFFITI
            </div>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: "1px" }}>
              WALL ART VISUALIZER
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <label
            style={{
              padding: "6px 12px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: 6,
              fontSize: 11,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            📁 Fotka
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
          </label>
          <button
            onClick={bgMode === "camera" ? stopCamera : startCamera}
            style={{
              padding: "6px 12px",
              background:
                bgMode === "camera"
                  ? "rgba(255,0,110,0.3)"
                  : "rgba(255,255,255,0.1)",
              borderRadius: 6,
              fontSize: 11,
              cursor: "pointer",
              border: `1px solid ${bgMode === "camera" ? "rgba(255,0,110,0.5)" : "rgba(255,255,255,0.15)"}`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            📷 {bgMode === "camera" ? "Stop" : "Kamera"}
          </button>
        </div>
      </div>

      {cameraError && (
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(255,0,110,0.15)",
            color: "#ff006e",
            fontSize: 12,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {cameraError}
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          padding: "8px 16px",
          background: "rgba(255,255,255,0.05)",
          textAlign: "center",
          fontSize: 13,
          color: phase === "select" ? "#ffbe0b" : "#aaa",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {phase === "select" && corners.length === 0 && "👆 Ťukni na 4 rohy steny — ľavý horný → pravý horný → pravý dolný → ľavý dolný"}
        {phase === "select" && corners.length > 0 && corners.length < 4 && `Bod ${corners.length}/4 hotový — ťukni ďalší roh (${["pravý horný", "pravý dolný", "ľavý dolný"][corners.length - 1]})`}
        {phase === "preview" && "✅ Graffiti umiestnené! Ťahaj rohy pre úpravu. Vyber dizajn dole."}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            cursor: phase === "select" ? "crosshair" : dragging >= 0 ? "grabbing" : "default",
            display: "block",
          }}
        />
        {corners.length === 0 && phase === "select" && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                border: "2px dashed rgba(255,255,255,0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                fontSize: 30,
              }}
            >
              👆
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
              Označ 4 rohy steny
            </div>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div
        style={{
          background: "linear-gradient(0deg, rgba(10,10,15,1) 0%, rgba(10,10,15,0.95) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        {/* Graffiti selector */}
        <div
          style={{
            padding: "10px 16px 6px",
            display: "flex",
            gap: 8,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedDesign(i);
              }}
              style={{
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: 8,
                border: selectedDesign === i ? `2px solid ${COLORS[i]}` : "2px solid rgba(255,255,255,0.1)",
                background:
                  selectedDesign === i
                    ? `${COLORS[i]}22`
                    : "rgba(255,255,255,0.05)",
                color: selectedDesign === i ? COLORS[i] : "#888",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.5px",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Opacity + actions */}
        <div
          style={{
            padding: "8px 16px 12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 11, color: "#666", flexShrink: 0 }}>
            Priehľadnosť
          </span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            style={{
              flex: 1,
              height: 4,
              accentColor: "#ff006e",
            }}
          />
          <span style={{ fontSize: 11, color: "#666", width: 32, textAlign: "right" }}>
            {Math.round(opacity * 100)}%
          </span>
          <button
            onClick={reset}
            style={{
              padding: "6px 14px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "#ccc",
              fontSize: 11,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Reset
          </button>
          {corners.length === 4 && (
            <button
              onClick={saveImage}
              style={{
                padding: "6px 14px",
                background: "linear-gradient(135deg, #ff006e, #8338ec)",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              💾 Uložiť
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
