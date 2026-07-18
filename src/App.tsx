import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, ChevronDown, Trash2, Clock, CheckCircle, AlertTriangle, XCircle, BarChart3, HelpCircle, Sparkles } from 'lucide-react';
import { useStore } from './stores/appStore';
import { VisualSeal } from './components/seal/VisualSeal';
import { PillarsDisplay } from './components/pillars/PillarsDisplay';
import type { SourceType } from './types';

const SOURCES: { value: SourceType; label: string }[] = [
  { value: 'unknown', label: 'Sursă necunoscută' },
  { value: 'human',   label: 'Human' },
  { value: 'claude',  label: 'Claude (Anthropic)' },
  { value: 'gpt-4',   label: 'GPT-4 (OpenAI)' },
  { value: 'gemini',  label: 'Gemini (Google)' },
  { value: 'hybrid',  label: 'Human + AI (Hybrid)' },
];

const DEMO_TEXTS = [
  {
    label: 'Text de calitate',
    source: 'human' as SourceType,
    text: `Educația timpurie reprezintă fundamentul dezvoltării cognitive a copilului. Cercetările longitudinale desfășurate pe parcursul a 20 de ani demonstrează că intervențiile educaționale aplicate între 0-6 ani generează un randament de 7-12% în termeni de beneficii sociale pe termen lung.

Această perspectivă nu înseamnă că educația ulterioară este irelevantă. Dimpotrivă, fiecare etapă de dezvoltare contribuie în mod specific la formarea individului. Ceea ce diferențiază perioada timpurie este plasticitatea neuronală ridicată și receptivitatea la stimuli externi.

Prin urmare, investițiile în educația preșcolară nu reprezintă un cost, ci o decizie strategică cu impact măsurabil la nivel societal.`,
  },
  {
    label: 'Text cu zgomot',
    source: 'unknown' as SourceType,
    text: `ACȚIONAȚI ACUM! Ofertă limitată - doar 3 locuri rămase! Toți experții sunt de acord că aceasta este SINGURA metodă care funcționează garantat 100%. Nu există altă cale! Studii recente confirmă că rezultatele sunt imediate. Nu pierdeți această oportunitate unică în viață!`,
  },
  {
    label: 'Output AI hybrid',
    source: 'hybrid' as SourceType,
    text: `Siguranța cibernetică reprezintă o provocare complexă în contextul actual. Desigur! Iată câteva considerente importante de luat în calcul:

În primul rând, este esențial să înțelegem că amenințările evoluează constant. Totodată, organizațiile trebuie să adopte o abordare proactivă, nu reactivă. Cu toate acestea, implementarea soluțiilor necesită resurse semnificative.

Este important de menționat că nu există o soluție universală. Fiecare organizație trebuie să-și evalueze propriul profil de risc.`,
  },
];

function StatusBadge({ status }: { status: string }) {
  const map = {
    approved: { icon: <CheckCircle size={12} />, label: 'APROBAT',    cls: 'text-green-400 border-green-400/30 bg-green-400/10' },
    partial:  { icon: <AlertTriangle size={12} />, label: 'PARȚIAL',  cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
    rejected: { icon: <XCircle size={12} />,     label: 'RESPINS',   cls: 'text-red-400 border-red-400/30 bg-red-400/10'       },
  };
  const m = map[status as keyof typeof map] || map.partial;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono uppercase ${m.cls}`}>
      {m.icon}{m.label}
    </span>
  );
}

export default function App() {
  const {
    inputText, inputSource, isAnalyzing, currentResult, sessions,
    error, user, activeTab,
    setInput, setSource, setActiveTab, analyze, deleteSession, upgradeToPro,
  } = useStore();

  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const activeSessions = sessions.filter(s => !s.deleted);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#fafafa] font-sans">

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 md:px-10
        bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#27272a]">

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-[#d4af37]/40 flex items-center justify-center
            bg-gradient-to-br from-[#d4af37]/10 to-transparent">
            <Shield size={14} className="text-[#d4af37]" />
          </div>
          <span className="font-['Playfair_Display'] italic text-lg">
            ami<span className="text-[#d4af37]">pecetai</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {(['demo', 'dashboard', 'how'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'text-[#d4af37] bg-[#d4af37]/10'
                  : 'text-[#71717a] hover:text-[#a1a1aa]'
              }`}>
              {tab === 'demo' ? 'Demo' : tab === 'dashboard' ? 'Sesiuni' : 'Cum funcționează'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#71717a]">
            {user.tier === 'free'
              ? `${user.stampsLimit - user.stampsToday} pecete rămase`
              : '∞ Pro'}
          </span>
          {user.tier === 'free' && (
            <button onClick={upgradeToPro}
              className="px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider
                bg-gradient-to-r from-[#d4af37] to-[#cd7f32] text-[#0a0a0f] font-bold
                hover:opacity-90 transition-opacity">
              Pro
            </button>
          )}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
        {[
          { size: 400, color: 'rgba(212,175,55,0.06)', x: '70%', y: '30%', d: 20 },
          { size: 300, color: 'rgba(34,197,94,0.04)',  x: '15%', y: '60%', d: 25 },
        ].map((orb, i) => (
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y,
              transform: 'translate(-50%,-50%)',
              background: `radial-gradient(ellipse, ${orb.color}, transparent 70%)` }}
            animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0] }}
            transition={{ duration: orb.d, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E\")" }}
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }} className="relative z-10">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
            border border-[#d4af37]/30 bg-[#d4af37]/5 mb-6">
            <Sparkles size={10} className="text-[#d4af37]" />
            <span className="font-mono text-xs tracking-widest uppercase text-[#d4af37]">
              Seal of Authority
            </span>
            <Sparkles size={10} className="text-[#d4af37]" />
          </div>

          <h1 className="font-['Playfair_Display'] text-4xl md:text-6xl font-normal leading-tight mb-4">
            Pune pecetea<br />
            <em className="text-[#d4af37]">pe sens</em>
          </h1>

          <p className="text-[#a1a1aa] text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8">
            Validează, certifică și autentifică orice output AI sau uman.
            <br />Zgomotul devine vizibil. Valoarea primește pecetea.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={() => setActiveTab('demo')}
              className="flex items-center gap-2 px-7 py-3 rounded-lg
                bg-gradient-to-r from-[#d4af37] to-[#cd7f32]
                text-[#0a0a0f] font-mono text-sm uppercase tracking-wider font-bold"
              whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(212,175,55,0.4)' }}
              whileTap={{ scale: 0.97 }}>
              <Zap size={14} /> Aplică o pecete
            </motion.button>
            <button onClick={() => setActiveTab('how')}
              className="flex items-center gap-2 px-7 py-3 rounded-lg
                border border-[#27272a] text-[#a1a1aa] font-mono text-sm uppercase tracking-wider
                hover:border-[#d4af37]/30 hover:text-[#fafafa] transition-colors">
              <HelpCircle size={14} /> Cei 7 piloni
            </button>
          </div>
        </motion.div>

        <motion.div className="flex justify-center mt-12 opacity-40"
          animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown size={20} className="text-[#71717a]" />
        </motion.div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 pb-20">

        <div className="flex gap-1 border border-[#27272a] rounded-lg p-1 mb-6 bg-[#111118] md:hidden">
          {(['demo', 'dashboard', 'how'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all ${
                activeTab === tab
                  ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'
                  : 'text-[#71717a]'
              }`}>
              {tab === 'demo' ? 'Demo' : tab === 'dashboard' ? 'Sesiuni' : 'Piloni'}
            </button>
          ))}
        </div>

        {/* ── DEMO TAB ──────────────────────────────────── */}
        {activeTab === 'demo' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="space-y-4">
              <div className="bg-[#111118] border border-[#27272a] rounded-xl p-5">
                <p className="font-mono text-xs uppercase tracking-wider text-[#71717a] mb-3">
                  Text pentru analiză
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {DEMO_TEXTS.map(d => (
                    <button key={d.label}
                      onClick={() => { setInput(d.text); setSource(d.source); }}
                      className="text-xs px-2.5 py-1 rounded border border-[#27272a]
                        text-[#71717a] hover:border-[#d4af37]/30 hover:text-[#a1a1aa]
                        font-mono transition-colors">
                      {d.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={inputText}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Introduceți textul de analizat — output AI, text uman, sau hybrid..."
                  rows={8}
                  className="w-full bg-[#0a0a0f] border border-[#27272a] rounded-lg
                    px-4 py-3 text-sm text-[#fafafa] placeholder-[#52525b]
                    font-sans resize-none outline-none focus:border-[#d4af37]/40
                    transition-colors leading-relaxed"
                />

                <div className="mt-3">
                  <p className="font-mono text-xs text-[#71717a] mb-1.5 uppercase tracking-wider">
                    Sursă declarată
                  </p>
                  <select
                    value={inputSource}
                    onChange={e => setSource(e.target.value as SourceType)}
                    className="w-full bg-[#0a0a0f] border border-[#27272a] rounded-lg
                      px-3 py-2 text-sm text-[#a1a1aa] font-mono
                      outline-none focus:border-[#d4af37]/40 transition-colors">
                    {SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="mt-2 text-xs text-red-400 font-mono">{error}</p>
                )}

                <motion.button
                  onClick={analyze}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="mt-4 w-full py-3 rounded-lg font-mono text-sm uppercase tracking-wider
                    bg-gradient-to-r from-[#d4af37] to-[#cd7f32]
                    text-[#0a0a0f] font-bold disabled:opacity-40 transition-opacity
                    flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}>
                  {isAnalyzing ? (
                    <>
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-[#0a0a0f]/40 border-t-[#0a0a0f]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Analizez cei 7 piloni...
                    </>
                  ) : (
                    <><Shield size={14} /> Aplică Pecetea</>
                  )}
                </motion.button>
              </div>

              {currentResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111118] border border-[#27272a] rounded-xl p-4
                    grid grid-cols-3 gap-3">
                  {[
                    { label: 'Cuvinte',   value: currentResult.wordCount },
                    { label: 'Zgomot',    value: `${Math.round(currentResult.noiseRatio * 100)}%` },
                    { label: 'Scor',      value: `${currentResult.overallScore}/100` },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-mono font-bold text-[#fafafa]">{s.value}</p>
                      <p className="text-xs font-mono text-[#71717a] uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {isAnalyzing && (
                  <motion.div key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-[#111118] border border-[#27272a] rounded-xl p-8 flex flex-col items-center gap-4">
                    <motion.div
                      className="w-20 h-20 rounded-full border-2 border-[#d4af37]/30 border-t-[#d4af37]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="font-['Playfair_Display'] italic text-lg text-[#fafafa]">
                      Analizez cei 7 piloni...
                    </p>
                    {['Extracție semantică', 'Validare rezonanță', 'Checklist CCL', 'Generez pecete'].map((step, i) => (
                      <motion.p key={step} className="text-xs font-mono text-[#71717a]"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.4 }}>
                        ✓ {step}
                      </motion.p>
                    ))}
                  </motion.div>
                )}

                {!isAnalyzing && currentResult && (
                  <motion.div key="result"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="space-y-4">

                    <div className="bg-[#111118] border border-[#27272a] rounded-xl p-5 flex flex-col items-center gap-4">
                      <VisualSeal seal={currentResult.sealData} score={currentResult.overallScore} size="md" />
                      <div className="text-center">
                        <StatusBadge status={currentResult.status} />
                        <p className="text-sm text-[#a1a1aa] mt-2 leading-relaxed max-w-xs">
                          {currentResult.summary}
                        </p>
                        <p className="text-xs font-mono text-[#52525b] mt-2 flex items-center justify-center gap-1">
                          <Clock size={10} />
                          Expiră: {currentResult.expiresAt.toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#111118] border border-[#27272a] rounded-xl p-4">
                      <p className="font-mono text-xs uppercase tracking-wider text-[#71717a] mb-3">
                        Analiza celor 7 piloni
                      </p>
                      <PillarsDisplay pillars={currentResult.pillars} />
                    </div>
                  </motion.div>
                )}

                {!isAnalyzing && !currentResult && (
                  <motion.div key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-[#111118] border border-[#27272a] rounded-xl p-12 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full border border-[#d4af37]/20
                      flex items-center justify-center text-3xl opacity-40">
                      ◎
                    </div>
                    <p className="font-['Playfair_Display'] italic text-[#52525b] text-center">
                      Introduceți un text și aplicați pecetea
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── DASHBOARD TAB ─────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs uppercase tracking-wider text-[#71717a]">
                {activeSessions.length} sesiuni active
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-[#71717a]">
                <BarChart3 size={12} />
                Pecete aplicate azi: {user.stampsToday}
              </div>
            </div>

            {activeSessions.length === 0 ? (
              <div className="text-center py-16 text-[#52525b] font-['Playfair_Display'] italic">
                Nicio sesiune încă. Aplicați prima pecete.
              </div>
            ) : (
              activeSessions.map(session => (
                <motion.div key={session.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111118] border border-[#27272a] rounded-xl overflow-hidden">

                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a24] transition-colors"
                    onClick={() => setExpandedSession(
                      expandedSession === session.id ? null : session.id
                    )}>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={session.result.status} />
                      <span className="text-sm text-[#a1a1aa] text-left line-clamp-1 max-w-xs">
                        {session.input.slice(0, 60)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-mono text-sm font-bold text-[#fafafa]">
                        {session.result.overallScore}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                        className="text-[#52525b] hover:text-red-400 transition-colors p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedSession === session.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[#27272a] px-4 pb-4 pt-3">
                        <div className="flex gap-6 items-start">
                          <VisualSeal seal={session.result.sealData} score={session.result.overallScore} size="sm" />
                          <div className="flex-1">
                            <PillarsDisplay pillars={session.result.pillars} />
                          </div>
                        </div>
                        <p className="text-xs font-mono text-[#52525b] mt-3 flex items-center gap-1">
                          <Clock size={9} />
                          Creat: {session.createdAt.toLocaleString('ro-RO')} ·
                          Expiră: {session.expiresAt.toLocaleDateString('ro-RO')}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ── HOW IT WORKS TAB ──────────────────────────── */}
        {activeTab === 'how' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-['Playfair_Display'] text-3xl font-normal mb-2">
                Cei <em className="text-[#d4af37]">7 Piloni</em>
              </h2>
              <p className="text-[#71717a] max-w-md mx-auto">
                Fiecare text trece prin 7 niveluri de validare înainte să primească pecetea.
              </p>
            </div>

            {[
              { num: '01', name: 'Extracție Semantică', icon: '⬡', color: '#3b82f6',
                desc: 'Segmentare în unități semantice. Extragere entități și vectori de influență. Metrică: rata de acoperire > 90%.' },
              { num: '02', name: 'Validare Rezonanță', icon: '◎', color: '#8b5cf6',
                desc: 'Test terasă: explicabil unui om obișnuit? Test temporal: rezonează după 7 zile? Test adversarial: rezistă la 3 întrebări critice?' },
              { num: '03', name: 'Structurare Narativă', icon: '▦', color: '#06b6d4',
                desc: 'Ierarhizare idei principale vs. subplot. Identificare arhetipuri narative. Generare "Manual de Rezonanță".' },
              { num: '04', name: 'Autentificare Etică', icon: '⬟', color: '#22c55e',
                desc: 'Checklist CCL: presiune temporală? Apel la autoritate falsă? Omisiune convenabilă? Framing manipulator? Sustenabilitate?' },
              { num: '05', name: 'Omologare Meserii', icon: '◈', color: '#d4af37',
                desc: '"Generator de text" → "Vectorist de Influență". "Analiză date" → "Cartograf de Pattern-uri Invizibile". Traducere din funcție brută în rol uman.' },
              { num: '06', name: 'Cartografiere Black Box', icon: '⬜', color: '#f59e0b',
                desc: 'Reverse engineering parțial al sursei. Identificare "chin semantic" — artefacte de generare AI. Vizualizare flux decizional.' },
              { num: '07', name: 'Reversibilitate Garantată', icon: '↺', color: '#ef4444',
                desc: 'TTL implicit 30 zile. Kill switch: ștergere instant. Revocare cu justificare. Export complet JSON. Drept la uitare.' },
            ].map((pillar, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-5 bg-[#111118] border border-[#27272a] rounded-xl p-5
                  hover:border-[#d4af37]/20 transition-colors group">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <span className="text-2xl" style={{ color: pillar.color }}>{pillar.icon}</span>
                  <span className="font-mono text-xs text-[#52525b]">{pillar.num}</span>
                </div>
                <div>
                  <h3 className="font-['Playfair_Display'] text-lg mb-1"
                    style={{ color: pillar.color }}>{pillar.name}</h3>
                  <p className="text-sm text-[#71717a] leading-relaxed">{pillar.desc}</p>
                </div>
              </motion.div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {[
                { tier: 'Free', price: '0€', color: '#27272a', textColor: '#a1a1aa',
                  features: ['3 pecete / zi', 'Valabilitate 7 zile', 'Piloni 1-4', 'Watermark pe pecete'] },
                { tier: 'Pro', price: '19€/lună', color: '#d4af37', textColor: '#0a0a0f',
                  features: ['Pecete nelimitate', 'Pecete permanente', 'Toți 7 pilonii', 'API access', 'White-label', 'Prioritate procesare'] },
              ].map(plan => (
                <div key={plan.tier}
                  className="rounded-xl p-5 border"
                  style={{ borderColor: `${plan.color}40`, background: `${plan.color}08` }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-['Playfair_Display'] text-xl" style={{ color: plan.color }}>
                      {plan.tier}
                    </span>
                    <span className="font-mono text-lg font-bold" style={{ color: plan.color }}>
                      {plan.price}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="text-sm text-[#a1a1aa] flex items-center gap-2">
                        <span style={{ color: plan.color }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {plan.tier === 'Pro' && (
                    <button onClick={upgradeToPro}
                      className="w-full mt-4 py-2.5 rounded-lg font-mono text-sm uppercase tracking-wider font-bold"
                      style={{ background: `linear-gradient(135deg, ${plan.color}, #cd7f32)`, color: '#0a0a0f' }}>
                      Upgrade
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-[#27272a] py-6 px-6 flex items-center justify-between flex-wrap gap-3">
        <span className="font-['Playfair_Display'] italic text-[#52525b]">
          ami<span className="text-[#d4af37]">pecetai</span>.ai
        </span>
        <p className="font-mono text-xs text-[#52525b]">
          Blake3 · SHA-256 · Dilithium · GDPR · EU AI Act
        </p>
      </footer>
    </div>
  );
}
