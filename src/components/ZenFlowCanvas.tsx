import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  shape: 'ring' | 'dot' | 'cross';
}

interface StrokePoint {
  x: number;
  y: number;
  time: number;
}

interface Stroke {
  points: StrokePoint[];
  startTime: number;
  lastActiveTime: number;
  isDrawing: boolean;
  color: string;
  subColor: string;
}

export const ZenFlowCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isPointerDownRef = useRef(false);
  const lastReleaseTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get current theme CSS variables
    const getThemeColors = () => {
      const root = getComputedStyle(document.documentElement);
      const main = root.getPropertyValue('--main').trim() || '#e2b714';
      const sub = root.getPropertyValue('--sub').trim() || '#646669';
      return { main, sub };
    };

    // Spawn kinetic zen particles along cursor movement
    const spawnParticles = (x: number, y: number, color: string) => {
      const count = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.6 + 0.4;
        const shapes: ('ring' | 'dot' | 'cross')[] = ['ring', 'dot', 'cross'];
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          alpha: 0.85,
          color,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
    };

    // Animation Render Loop
    const render = () => {
      const now = performance.now();
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // 1. Check disappearing logic for completed/released strokes
      // After finger is removed from screen, stroke stays for 1000ms, then fades over 450ms
      const HOLD_DELAY = 1000;
      const FADE_DURATION = 450;

      strokesRef.current = strokesRef.current.filter((stroke) => {
        if (stroke.isDrawing) return true;
        const elapsedSinceRelease = now - stroke.lastActiveTime;
        return elapsedSinceRelease < HOLD_DELAY + FADE_DURATION;
      });

      // 2. Draw active & fading strokes with ethereal zen ribbons
      strokesRef.current.forEach((stroke) => {
        if (stroke.points.length < 2) return;

        let strokeOpacity = 1;
        if (!stroke.isDrawing) {
          const elapsed = now - stroke.lastActiveTime;
          if (elapsed > HOLD_DELAY) {
            strokeOpacity = Math.max(0, 1 - (elapsed - HOLD_DELAY) / FADE_DURATION);
          }
        }

        ctx.save();
        ctx.globalAlpha = strokeOpacity;

        // Outer Ethereal Glow Track
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const xc = (stroke.points[i].x + stroke.points[i - 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i - 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
        }
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = strokeOpacity * 0.16;
        ctx.stroke();

        // Secondary Fluid Body Ribbon
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const xc = (stroke.points[i].x + stroke.points[i - 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i - 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
        }
        ctx.lineWidth = 6;
        ctx.globalAlpha = strokeOpacity * 0.45;
        ctx.stroke();

        // Crisp Core Thread Line
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const xc = (stroke.points[i].x + stroke.points[i - 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i - 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
        }
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = strokeOpacity * 0.95;
        ctx.stroke();

        // Geometric Node Constellation Dots along the gesture
        const step = Math.max(1, Math.floor(stroke.points.length / 10));
        for (let i = 0; i < stroke.points.length; i += step) {
          const pt = stroke.points[i];
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = stroke.color;
          ctx.globalAlpha = strokeOpacity * 0.9;
          ctx.fill();

          // Subtle orbital rings
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
          ctx.strokeStyle = stroke.subColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = strokeOpacity * 0.35;
          ctx.stroke();
        }

        ctx.restore();
      });

      // 3. Render and update interactive kinetic ambient particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.02);
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha *= 0.94;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.shape === 'dot') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'ring') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (p.shape === 'cross') {
          ctx.lineWidth = 1.2;
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x - s, p.y);
          ctx.lineTo(p.x + s, p.y);
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x, p.y + s);
          ctx.stroke();
        }

        ctx.restore();
      });

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    // Pointer Event Listeners (Mouse & Touch)
    const handlePointerDown = (e: PointerEvent) => {
      // Don't intercept if clicking an interactive control like button or link
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        return;
      }

      isPointerDownRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      const { main, sub } = getThemeColors();

      const newStroke: Stroke = {
        points: [{ x, y, time: now }],
        startTime: now,
        lastActiveTime: now,
        isDrawing: true,
        color: main,
        subColor: sub,
      };

      currentStrokeRef.current = newStroke;
      strokesRef.current.push(newStroke);
      spawnParticles(x, y, main);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current || !currentStrokeRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();

      const points = currentStrokeRef.current.points;
      const lastPt = points[points.length - 1];

      // Distance threshold for smooth fluid capture
      const dist = Math.hypot(x - lastPt.x, y - lastPt.y);
      if (dist > 3) {
        points.push({ x, y, time: now });
        currentStrokeRef.current.lastActiveTime = now;

        if (Math.random() < 0.6) {
          spawnParticles(x, y, currentStrokeRef.current.color);
        }
      }
    };

    const handlePointerUp = () => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      const now = performance.now();
      lastReleaseTimeRef.current = now;

      if (currentStrokeRef.current) {
        currentStrokeRef.current.isDrawing = false;
        currentStrokeRef.current.lastActiveTime = now;
        currentStrokeRef.current = null;
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="zen-flow-canvas"
      className="absolute inset-0 w-full h-full pointer-events-auto z-1"
      style={{
        touchAction: 'none',
      }}
      aria-label="Zen writing canvas - trace fingers across the screen to release mental clutter"
    />
  );
};
