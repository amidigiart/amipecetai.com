import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PILLAR_META } from '../../types';
import type { PillarResult } from '../../types';

interface Props {
  pillars: PillarResult[];
}

const STATUS_COLOR = {
  pass:    { bar: '#22c55e', bg: 'rgba(34,197,94,0.1)',  text: '#4ade80' },
  warning: { bar: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '#fbbf24' },
  fail:    { bar: '#ef4444', bg: 'rgba(239,68,68,0.1)',   text: '#f87171' },
};

export function PillarsDisplay({ pillars }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {pillars.map((pillar, i) => {
        const meta = PILLAR_META[pillar.id];
        const colors = STATUS_COLOR[pillar.status];
        const isOpen = expanded === pillar.id;

        return (
          <motion.div
            key={pillar.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : pillar.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg
                hover:bg-[#1a1a24] transition-colors group"
            >
              <span className="text-base flex-shrink-0">{meta.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-[#a1a1aa] truncate">
                    {pillar.name}
                  </span>
                  <span
                    className="text-xs font-mono font-bold ml-2 flex-shrink-0"
                    style={{ color: colors.text }}
                  >
                    {pillar.score}
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors.bar }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pillar.score}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <ChevronDown
                size={14}
                className={`text-[#52525b] transition-transform flex-shrink-0 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mx-2 mb-2 p-3 rounded-lg border"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: `${colors.bar}20`,
                    }}
                  >
                    <ul className="space-y-1">
                      {pillar.findings.map((f, fi) => (
                        <li key={fi} className="text-xs text-[#a1a1aa] leading-relaxed">
                          {f}
                        </li>
                      ))}
                    </ul>

                    {pillar.flags.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#27272a]">
                        {pillar.flags.map((flag, fi) => (
                          <p key={fi} className="text-xs text-amber-400/80 mt-1">
                            ⚠ {flag.description}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-[#27272a] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#52525b]">
                        Încredere: {Math.round(pillar.confidence * 100)}%
                      </span>
                      <span className="text-[10px] font-mono text-[#52525b]">
                        Pondere: {meta.weight}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
