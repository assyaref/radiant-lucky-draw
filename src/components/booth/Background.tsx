import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';

export const Background = memo(function Background() {
  const nebulaRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = nebulaRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const draw = () => {
      t += 0.0015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Camera pan offset - very slow breathing
      const panX = Math.sin(t * 0.1) * 30;
      const panY = Math.sin(t * 0.08) * 15;
      const breathScale = 1 + Math.sin(t * 0.2) * 0.005;

      ctx.save();
      ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
      ctx.scale(breathScale, breathScale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Layer 2: Animated Nebula - 8 clouds with rich colors
      const nebulaColors = [
        { r: 59, g: 130, b: 246 }, // Blue
        { r: 251, g: 191, b: 36 }, // Gold
        { r: 99, g: 102, b: 241 }, // Indigo
        { r: 168, g: 85, b: 247 }, // Purple
        { r: 34, g: 211, b: 238 }, // Cyan
        { r: 251, g: 191, b: 36 }, // Gold
        { r: 59, g: 130, b: 246 }, // Blue
        { r: 244, g: 114, b: 182 }, // Pink
      ];

      for (let i = 0; i < 8; i++) {
        const cx = canvas.width * (0.2 + 0.6 * Math.sin(t * 0.12 + i * 1.5));
        const cy = canvas.height * (0.15 + 0.7 * Math.cos(t * 0.08 + i * 0.9));
        const radius = 350 + 150 * Math.sin(t * 0.15 + i);
        const c = nebulaColors[i];
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const alpha = 0.04 + 0.025 * Math.sin(t * 0.3 + i * 0.7);
        gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Layer 3: Soft Fog - drifting translucent bands
      for (let i = 0; i < 4; i++) {
        const fogY = canvas.height * (0.2 + 0.6 * Math.sin(t * 0.05 + i * 1.3));
        const fogX = canvas.width * (0.1 + 0.8 * Math.sin(t * 0.04 + i * 0.8));
        const fogW = canvas.width * 0.5;
        const fogGrad = ctx.createLinearGradient(fogX - fogW / 2, fogY, fogX + fogW / 2, fogY);
        const fogAlpha = 0.02 + 0.015 * Math.sin(t * 0.1 + i);
        fogGrad.addColorStop(0, 'rgba(255,255,255,0)');
        fogGrad.addColorStop(0.5, `rgba(180, 200, 255, ${fogAlpha})`);
        fogGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        ctx.ellipse(fogX, fogY, fogW / 2, 60, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Layer 4: Moving Grid with perspective
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.03 + 0.015 * Math.sin(t * 0.2)})`;
      ctx.lineWidth = 0.5;
      const spacing = 80;
      const offsetX = (t * 15) % spacing;
      const offsetY = (t * 8) % spacing;
      for (let x = -offsetX; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = -offsetY; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Layer 5: Light Rays - cinematic god rays
      for (let i = 0; i < 6; i++) {
        const rayX = canvas.width * (0.1 + 0.8 * Math.sin(t * 0.15 + i * 1.2));
        const rayGrad = ctx.createLinearGradient(rayX, -100, rayX - 200, canvas.height + 100);
        const alpha = 0.03 + 0.02 * Math.sin(t * 0.2 + i * 0.6);
        rayGrad.addColorStop(0, `rgba(251, 191, 36, ${alpha})`);
        rayGrad.addColorStop(0.3, `rgba(59, 130, 246, ${alpha * 0.6})`);
        rayGrad.addColorStop(0.6, `rgba(251, 191, 36, ${alpha * 0.3})`);
        rayGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rayX - 100, -100);
        ctx.lineTo(rayX + 60, -100);
        ctx.lineTo(rayX + 300, canvas.height + 100);
        ctx.lineTo(rayX - 200, canvas.height + 100);
        ctx.closePath();
        ctx.fill();
      }

      // Layer 6: Lens Flare
      const flareX = canvas.width * (0.3 + 0.4 * Math.sin(t * 0.1));
      const flareY = canvas.height * (0.2 + 0.3 * Math.sin(t * 0.08 + 1));
      const flareGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, 200);
      flareGrad.addColorStop(0, `rgba(251, 191, 36, ${0.04 + 0.025 * Math.sin(t * 0.3)})`);
      flareGrad.addColorStop(0.3, `rgba(255, 255, 255, ${0.02 * Math.sin(t * 0.2)})`);
      flareGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(flareX - 200, flareY - 200, 400, 400);

      // Layer 7: Floating sparkle particles - gold dust
      for (let i = 0; i < 30; i++) {
        const sx = (Math.sin(t * 0.4 + i * 2.3) * 0.5 + 0.5) * canvas.width;
        const sy = (Math.cos(t * 0.25 + i * 1.7) * 0.5 + 0.5) * canvas.height;
        const size = 1 + Math.sin(t * 1.5 + i) * 0.5;
        const alpha = 0.2 + Math.sin(t * 1.2 + i * 0.8) * 0.15;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.fill();
      }

      // Layer 8: Blue dust particles - drifting upward
      for (let i = 0; i < 20; i++) {
        const bx = (Math.sin(t * 0.3 + i * 1.9) * 0.5 + 0.5) * canvas.width;
        const by = ((t * 0.02 + i * 0.05) % 1) * canvas.height;
        const size = 0.8 + Math.sin(t * 1.2 + i) * 0.4;
        const alpha = 0.15 + Math.sin(t * 0.9 + i * 0.6) * 0.1;
        ctx.beginPath();
        ctx.arc(bx, by, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.fill();
      }

      // Layer 9: Moving Spotlights - sweeping beams
      for (let i = 0; i < 3; i++) {
        const spotX = canvas.width * (0.15 + 0.7 * Math.sin(t * 0.08 + i * 2.1));
        const spotGrad = ctx.createRadialGradient(spotX, -50, 0, spotX, -50, canvas.height * 0.7);
        const spotAlpha = 0.03 + 0.02 * Math.sin(t * 0.12 + i * 1.4);
        spotGrad.addColorStop(0, `rgba(251, 191, 36, ${spotAlpha})`);
        spotGrad.addColorStop(0.4, `rgba(59, 130, 246, ${spotAlpha * 0.5})`);
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.moveTo(spotX - 120, -50);
        ctx.lineTo(spotX + 120, -50);
        ctx.lineTo(spotX + 400, canvas.height);
        ctx.lineTo(spotX - 400, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-[1]">
      {/* Layer 1: Deep space gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0b1426] to-[#0f172a]" />

      {/* Layer 2: Nebula canvas */}
      <canvas
        ref={nebulaRef}
        className="absolute inset-0"
        aria-hidden="true"
      />

      {/* Layer 7: Floating Energy Rings */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: [1, 1.015, 1],
          rotate: 360,
          opacity: [0.25, 0.4, 0.25],
        }}
        transition={{
          scale: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
          rotate: { repeat: Infinity, duration: 50, ease: 'linear' },
          opacity: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
        }}
      >
        <div className="h-[700px] w-[700px] rounded-full border border-blue-500/8" />
        <div
          className="absolute inset-16 rounded-full border border-amber-400/6"
          style={{ transform: 'rotate(45deg)' }}
        />
        <div
          className="absolute inset-32 rounded-full border border-blue-400/5"
          style={{ transform: 'rotate(-30deg)' }}
        />
        <div
          className="absolute inset-48 rounded-full border border-amber-400/4"
          style={{ transform: 'rotate(15deg)' }}
        />
      </motion.div>

      {/* Lens flare */}
      <motion.div
        className="absolute z-[3] h-40 w-40"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.5, 0.2],
          left: ['25%', '30%', '25%'],
          top: ['15%', '20%', '15%'],
        }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
      >
        <div className="h-full w-full rounded-full bg-gradient-radial from-amber-400/25 via-blue-500/10 to-transparent blur-3xl" />
      </motion.div>

      {/* Secondary lens flare */}
      <motion.div
        className="absolute z-[3] h-32 w-32"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.35, 0.15],
          left: ['65%', '70%', '65%'],
          top: ['60%', '55%', '60%'],
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
      >
        <div className="h-full w-full rounded-full bg-gradient-radial from-blue-400/20 via-amber-400/8 to-transparent blur-3xl" />
      </motion.div>

      {/* Moving spotlight beams (DOM layer) */}
      <motion.div
        className="absolute z-[2] h-[60vh] w-[30vw]"
        animate={{
          left: ['10%', '70%', '10%'],
          opacity: [0.08, 0.18, 0.08],
          rotate: [0, 8, 0],
        }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      >
        <div className="h-full w-full bg-gradient-to-b from-amber-400/20 via-blue-500/5 to-transparent blur-3xl" style={{ clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0 100%)' }} />
      </motion.div>

      {/* Secondary spotlight */}
      <motion.div
        className="absolute z-[2] h-[55vh] w-[25vw]"
        animate={{
          left: ['60%', '15%', '60%'],
          opacity: [0.06, 0.15, 0.06],
          rotate: [0, -6, 0],
        }}
        transition={{ repeat: Infinity, duration: 22, ease: 'easeInOut' }}
      >
        <div className="h-full w-full bg-gradient-to-b from-blue-400/20 via-amber-400/5 to-transparent blur-3xl" style={{ clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0 100%)' }} />
      </motion.div>
    </div>
  );
});
