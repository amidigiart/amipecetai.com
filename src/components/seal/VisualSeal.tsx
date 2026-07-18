import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SealData } from '../../types';

interface Props {
  seal:  SealData;
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = { sm: 160, md: 220, lg: 300 };

export function VisualSeal({ seal, score, size = 'md' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const px = SIZE[size];

  const colors = {
    approved: { ring: '#d4af37', inner: '#22c55e', glow: 'rgba(34,197,94,0.4)'  },
    partial:  { ring: '#d4af37', inner: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
    rejected: { ring: '#cd7f32', inner: '#ef4444', glow: 'rgba(239,68,68,0.4)'  },
  };
  const c = colors[seal.status];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);

    const hash = seal.hashShort;
    ctx.fillStyle = '#000000';
    for (let i = 0; i < hash.length; i++) {
      const v = parseInt(hash[i], 16);
      for (let b = 0; b < 4; b++) {
        if ((v >> b) & 1) {
          const x = ((i * 4 + b) % 8) * 8;
          const y = Math.floor((i * 4 + b) / 8) * 8;
          ctx.fillRect(x, y, 7, 7);
        }
      }
    }
    [[0,0],[48,0],[0,48]].forEach(([x,y]) => {
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 14, 14);
      ctx.fillRect(x+3, y+3, 8, 8);
    });
  }, [seal.hashShort]);

  return (
    <AnimatePresence>
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: px, height: px }}
        initial={{ scale: 0, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
      >
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(ellipse at center, ${c.glow}, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <svg width={px} height={px} viewBox="0 0 220 220" className="absolute inset-0">
          <defs>
            <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#d4af37" />
              <stop offset="50%"  stopColor="#ffd700" />
              <stop offset="100%" stopColor="#cd7f32" />
            </linearGradient>
            <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={c.inner} stopOpacity="0.9" />
              <stop offset="100%" stopColor={c.ring}  stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Outer decorative ring */}
          <circle cx="110" cy="110" r="105" fill="none" stroke="url(#goldRing)" strokeWidth="4" />

          {/* Decorative notches */}
          {Array.from({ length: 36 }, (_, i) => {
            const angle = (i * 10 - 90) * Math.PI / 180;
            const r1 = 100, r2 = i % 3 === 0 ? 92 : 96;
            return (
              <line key={i}
                x1={110 + r1 * Math.cos(angle)} y1={110 + r1 * Math.sin(angle)}
                x2={110 + r2 * Math.cos(angle)} y2={110 + r2 * Math.sin(angle)}
                stroke="url(#goldRing)" strokeWidth={i % 3 === 0 ? 2 : 1} opacity="0.8"
              />
            );
          })}

          {/* Middle ring */}
          <circle cx="110" cy="110" r="84" fill="none" stroke="url(#goldRing)" strokeWidth="1.5" opacity="0.5" />

          {/* Inner fill */}
          <circle cx="110" cy="110" r="78" fill="#0a0a0f" />
          <circle cx="110" cy="110" r="76" fill="url(#innerGrad)" opacity="0.15" />

          {/* Inner border */}
          <circle cx="110" cy="110" r="76" fill="none" stroke={c.inner} strokeWidth="1.5" opacity="0.6" />

          {/* Score arc */}
          <circle
            cx="110" cy="110" r="68"
            fill="none"
            stroke={c.inner}
            strokeWidth="3"
            strokeDasharray={`${score * 4.27} 427`}
            strokeDashoffset="107"
            strokeLinecap="round"
            opacity="0.8"
            filter="url(#glow)"
          />

          {/* Center icon */}
          <text x="110" y="102" textAnchor="middle" fontSize="28"
            fill={c.inner} fontFamily="serif" filter="url(#glow)">
            {seal.icon}
          </text>

          {/* Score */}
          <text x="110" y="124" textAnchor="middle" fontSize="18"
            fill="#fafafa" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
            {score}
          </text>

          {/* /100 */}
          <text x="110" y="136" textAnchor="middle" fontSize="9"
            fill="#71717a" fontFamily="'JetBrains Mono', monospace" letterSpacing="2">
            /100
          </text>

          {/* Hash */}
          <text x="110" y="156" textAnchor="middle" fontSize="8"
            fill="#d4af37" fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5">
            {seal.hashShort}
          </text>

          {/* Date */}
          <text x="110" y="170" textAnchor="middle" fontSize="7"
            fill="#71717a" fontFamily="'JetBrains Mono', monospace">
            {seal.date}
          </text>

          {/* Label arc */}
          <defs>
            <path id="labelArc" d="M 30,110 A 80,80 0 0 1 190,110" />
          </defs>
          <text fontSize="7.5" fontFamily="'Playfair Display', serif" fill="#d4af37" letterSpacing="2">
            <textPath href="#labelArc" startOffset="50%" textAnchor="middle">
              {seal.label}
            </textPath>
          </text>

          {/* Bottom: AMIPECETAI */}
          <defs>
            <path id="bottomArc" d="M 35,115 A 75,75 0 0 0 185,115" />
          </defs>
          <text fontSize="6" fontFamily="'JetBrains Mono', monospace" fill="#52525b" letterSpacing="3">
            <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
              AMIPECETAI.AI
            </textPath>
          </text>
        </svg>

        {/* QR in corner */}
        {size !== 'sm' && (
          <motion.div
            className="absolute bottom-2 right-2 bg-white p-0.5 rounded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <canvas ref={canvasRef} width={64} height={64} style={{ width: 40, height: 40 }} />
          </motion.div>
        )}

        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(212,175,55,0.3) 5%, transparent 10%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
