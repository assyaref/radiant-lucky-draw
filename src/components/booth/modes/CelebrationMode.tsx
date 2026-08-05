import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooth } from './BoothContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

interface Firework {
  x: number;
  y: number;
  particles: { x: number; y: number; vx: number; vy: number; color: string; life: number }[];
}

export function CelebrationMode() {
  const { mode, celebrationData } = useBooth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showName, setShowName] = useState(false);

  // Confetti + Fireworks canvas
  useEffect(() => {
    if (mode !== 'celebration') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti: Particle[] = [];
    const fireworks: Firework[] = [];
    const COLORS = [
      '#fbbf24',
      '#f59e0b',
      '#ef4444',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#10b981',
      '#ffffff',
    ];

    // Spawn confetti
    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * -1,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        r: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: Math.random() * 200 + 200,
      });
    }

    let animId: number;
    let t = 0;

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update confetti
      for (let i = confetti.length - 1; i >= 0; i--) {
        const p = confetti[i];
        p.x += p.vx;
        p.vy += 0.05;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life--;

        if (p.life <= 0 || p.y > canvas.height + 20) {
          confetti.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      }

      // Spawn fireworks
      if (t % 30 === 0 && fireworks.length < 5) {
        const fx = Math.random() * canvas.width * 0.6 + canvas.width * 0.2;
        const fy = Math.random() * canvas.height * 0.3 + canvas.height * 0.1;
        const fParticles = [];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        for (let i = 0; i < 40; i++) {
          const angle = (Math.PI * 2 * i) / 40;
          const speed = Math.random() * 4 + 2;
          fParticles.push({
            x: fx,
            y: fy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            life: 60,
          });
        }
        fireworks.push({ x: fx, y: fy, particles: fParticles });
      }

      // Update fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const f = fireworks[i];
        for (let j = f.particles.length - 1; j >= 0; j--) {
          const p = f.particles[j];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.life--;

          if (p.life <= 0) {
            f.particles.splice(j, 1);
            continue;
          }

          const alpha = p.life / 60;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (f.particles.length === 0) {
          fireworks.splice(i, 1);
        }
      }

      // Spotlight effect
      const spotGrad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height * 0.3,
        0,
        canvas.width / 2,
        canvas.height * 0.3,
        canvas.width * 0.6,
      );
      spotGrad.addColorStop(0, `rgba(251, 191, 36, ${0.08 + 0.04 * Math.sin(t * 0.05)})`);
      spotGrad.addColorStop(0.5, `rgba(59, 130, 246, ${0.04 * Math.sin(t * 0.03)})`);
      spotGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(draw);
    };
    draw();

    // Show name after delay
    setTimeout(() => setShowName(true), 500);

    return () => {
      cancelAnimationFrame(animId);
      setShowName(false);
    };
  }, [mode]);

  return (
    <AnimatePresence>
      {mode === 'celebration' && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Canvas for confetti + fireworks */}
          <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />

          {/* Winner name overlay */}
          <AnimatePresence>
            {showName && celebrationData && (
              <motion.div
                className="relative z-10 text-center"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 150, damping: 12 }}
              >
                <motion.p
                  className="mb-2 text-lg font-bold tracking-[0.3em] text-amber-400/70 uppercase"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  🎉 Congratulations! 🎉
                </motion.p>

                <motion.h1
                  className="mb-4 text-6xl font-black tracking-wider md:text-8xl"
                  animate={{
                    scale: [1, 1.05, 1],
                    textShadow: [
                      '0 0 20px rgba(251,191,36,0.3)',
                      '0 0 40px rgba(251,191,36,0.6)',
                      '0 0 20px rgba(251,191,36,0.3)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444, #fbbf24)',
                    backgroundSize: '300% 300%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {celebrationData.winnerName}
                </motion.h1>

                <motion.p
                  className="text-2xl font-bold tracking-wider text-white/60"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                >
                  {celebrationData.prize}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
