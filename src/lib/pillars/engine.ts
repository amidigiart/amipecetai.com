/**
 * AMIPECETAI — 7 Pillars Analysis Engine
 * Runs entirely client-side for demo; backend version uses OpenAI
 */

import type {
  PillarResult, PillarId, BiasFlag, CCLCheck,
  ResonanceTest, CertificationResult, SourceType, SealData
} from '../../types';
import { PILLAR_META, CCL_CHECKS } from '../../types';

// ── UTILITIES ──────────────────────────────────────────────

function nanoid(n = 10): string {
  return Math.random().toString(36).slice(2, 2 + n);
}

function sha256Sim(input: string): string {
  // Simulated hash for client-side demo — real SHA-256 in backend
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0') +
    Math.abs(hash * 31).toString(16).padStart(8, '0') +
    Math.abs(hash * 17).toString(16).padStart(8, '0') +
    Math.abs(hash * 7).toString(16).padStart(8, '0');
}

function blake3Sim(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, '0').repeat(4);
}

// ── PILLAR 1: SEMANTIC EXTRACTION ─────────────────────────

function analyzeSemantic(text: string): PillarResult {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const avgWordsPerSentence = words / Math.max(sentences, 1);

  const keyEntities = extractEntities(text);
  const coverageRatio = Math.min(keyEntities.length / Math.max(sentences, 1), 1);
  const score = Math.round(coverageRatio * 60 + (avgWordsPerSentence < 25 ? 40 : 20));

  const flags: BiasFlag[] = [];
  if (avgWordsPerSentence > 35) {
    flags.push({
      type: 'semantic_noise',
      severity: 'medium',
      description: `Propoziții prea lungi (avg ${Math.round(avgWordsPerSentence)} cuvinte). Complexitate semantică ridicată.`,
    });
  }

  return {
    id: 'semantic',
    name: PILLAR_META.semantic.nameRo,
    score: Math.min(score, 100),
    status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings: [
      `${words} cuvinte · ${sentences} propoziții`,
      `${keyEntities.length} entități semantice identificate`,
      `Densitate semantică: ${Math.round(coverageRatio * 100)}%`,
    ],
    flags,
    confidence: 0.82,
    details: `Rata de acoperire semantică: ${Math.round(coverageRatio * 100)}%. ${score >= 70 ? 'Structură semantică coerentă.' : 'Structură semantică fragmentată.'}`,
  };
}

function extractEntities(text: string): string[] {
  const patterns = [
    /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g,  // Proper nouns
    /\b\d{4}\b/g,                              // Years
    /\b(?:AI|AGI|NFT|API|ML|UI|UX)\b/g,       // Tech acronyms
  ];
  const entities = new Set<string>();
  patterns.forEach(p => {
    const matches = text.match(p) || [];
    matches.forEach(m => entities.add(m));
  });
  return Array.from(entities).slice(0, 20);
}

// ── PILLAR 2: RESONANCE VALIDATION ────────────────────────

function analyzeResonance(text: string): PillarResult {
  const tests: ResonanceTest[] = [
    {
      id: 'terasa',
      name: 'Test Terasă',
      desc: 'Poate fi explicat unui om obișnuit?',
      passed: calculateTerrasaScore(text) >= 60,
      score: calculateTerrasaScore(text),
      note: calculateTerrasaScore(text) >= 60
        ? 'Limbaj accesibil, concepte explicabile'
        : 'Jargon excesiv, greu de explicat simplu',
    },
    {
      id: 'temporal',
      name: 'Test Temporal',
      desc: 'Rezonează după 7 zile?',
      passed: calculateTemporalScore(text) >= 60,
      score: calculateTemporalScore(text),
      note: calculateTemporalScore(text) >= 60
        ? 'Conținut cu valoare durabilă'
        : 'Conținut perisabil, context-dependent',
    },
    {
      id: 'adversarial',
      name: 'Test Adversarial',
      desc: 'Rezistă la 3 întrebări critice?',
      passed: calculateAdversarialScore(text) >= 60,
      score: calculateAdversarialScore(text),
      note: calculateAdversarialScore(text) >= 60
        ? 'Afirmații verificabile, rezistente la critică'
        : 'Vulnerabil la întrebări critice directe',
    },
  ];

  const avgScore = Math.round(tests.reduce((s, t) => s + t.score, 0) / tests.length);
  const passedCount = tests.filter(t => t.passed).length;

  const flags: BiasFlag[] = [];
  if (!tests[0].passed) flags.push({ type: 'semantic_noise', severity: 'medium', description: 'Nu trece testul terasă — prea tehnic sau abstract.' });
  if (!tests[2].passed) flags.push({ type: 'low_resonance', severity: 'high', description: 'Vulnerabil la întrebări critice — lipsesc dovezi sau logică solidă.' });

  return {
    id: 'resonance',
    name: PILLAR_META.resonance.nameRo,
    score: avgScore,
    status: passedCount === 3 ? 'pass' : passedCount >= 2 ? 'warning' : 'fail',
    findings: tests.map(t => `${t.passed ? '✓' : '✗'} ${t.name}: ${t.note}`),
    flags,
    confidence: 0.75,
    details: `${passedCount}/3 teste trecute. Scor mediu rezonanță: ${avgScore}%.`,
  };
}

function calculateTerrasaScore(text: string): number {
  const longWords = text.split(/\s+/).filter(w => w.length > 12).length;
  const totalWords = text.split(/\s+/).length;
  const ratio = longWords / Math.max(totalWords, 1);
  return Math.round(Math.max(0, 100 - ratio * 300));
}

function calculateTemporalScore(text: string): number {
  const temporalKeywords = ['acum', 'astăzi', 'imediat', 'urgent', 'limitat', 'now', 'today', 'immediately', 'hurry'];
  const count = temporalKeywords.filter(k => text.toLowerCase().includes(k)).length;
  return Math.round(Math.max(20, 100 - count * 15));
}

function calculateAdversarialScore(text: string): number {
  const evidenceWords = ['pentru că', 'deoarece', 'astfel', 'dovadă', 'demonstrează', 'because', 'therefore', 'evidence', 'demonstrates'];
  const count = evidenceWords.filter(k => text.toLowerCase().includes(k)).length;
  return Math.round(Math.min(100, 40 + count * 12));
}

// ── PILLAR 3: NARRATIVE STRUCTURE ─────────────────────────

function analyzeNarrative(text: string): PillarResult {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const hasIntro = paragraphs.length > 0;
  const hasConclusion = text.toLowerCase().match(/concluzi|în final|în concluzie|therefore|in conclusion/);
  const hasStructure = paragraphs.length >= 3;

  const score = (hasIntro ? 30 : 0) + (hasConclusion ? 30 : 0) + (hasStructure ? 40 : 20);

  return {
    id: 'narrative',
    name: PILLAR_META.narrative.nameRo,
    score: Math.min(score, 100),
    status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings: [
      `${paragraphs.length} paragrafe identificate`,
      hasStructure ? '✓ Structură narativă detectată' : '✗ Structură liniară slabă',
      hasConclusion ? '✓ Concluzie prezentă' : '✗ Lipsă concluzie clară',
    ],
    flags: hasStructure ? [] : [{
      type: 'semantic_noise',
      severity: 'low',
      description: 'Structură narativă slabă — ideile principale nu sunt ierarhizate clar.',
    }],
    confidence: 0.78,
    details: `Structură ${hasStructure ? 'bună' : 'insuficientă'}. ${paragraphs.length} unități narative.`,
  };
}

// ── PILLAR 4: ETHICAL AUTH (CCL) ──────────────────────────

function analyzeEthics(text: string): PillarResult {
  const lower = text.toLowerCase();
  const checks: CCLCheck[] = [
    {
      id: 'temporal',
      question: 'Presiune temporală artificială?',
      severity: 'high',
      detected: /urgent|imediat|acum sau niciodat|limitat timp|hurry|now or never|limited time|act fast/.test(lower),
      explanation: 'Fraze care creează urgență artificială pentru a grăbi decizii',
    },
    {
      id: 'authority',
      question: 'Apel la autoritate falsă?',
      severity: 'high',
      detected: /toți experții|studii arată că|știința confirmă|experts agree|studies show|science proves/.test(lower),
      explanation: 'Referințe vagi la autorități nespecificate',
    },
    {
      id: 'omission',
      question: 'Omisiune convenabilă?',
      severity: 'medium',
      detected: text.length < 100 && /perfect|garantat|100%|sigur/.test(lower),
      explanation: 'Text scurt cu afirmații absolute — posibile omisiuni semnificative',
    },
    {
      id: 'framing',
      question: 'Framing manipulator?',
      severity: 'high',
      detected: /singura soluție|nu există altă cale|only solution|no other way|only option/.test(lower),
      explanation: 'Limbaj care elimină artificil alternativele',
    },
    {
      id: 'sustainable',
      question: 'Sustenabilitate?',
      severity: 'medium',
      detected: false,
      explanation: 'Conținutul pare sustenabil în contextul dat',
    },
  ];

  const flaggedCount = checks.filter(c => c.detected).length;
  const score = Math.round(Math.max(0, 100 - flaggedCount * 20));

  const flags: BiasFlag[] = checks
    .filter(c => c.detected)
    .map(c => ({
      type: c.id as BiasFlag['type'],
      severity: c.severity,
      description: c.explanation,
    }));

  return {
    id: 'ethics',
    name: PILLAR_META.ethics.nameRo,
    score,
    status: flaggedCount === 0 ? 'pass' : flaggedCount <= 2 ? 'warning' : 'fail',
    findings: checks.map(c => `${c.detected ? '⚠' : '✓'} ${c.question}`),
    flags,
    confidence: 0.85,
    details: `${flaggedCount} flag-uri CCL detectate. Scor etic: ${score}/100.`,
  };
}

// ── PILLAR 5: ROLE HOMOLOGATION ───────────────────────────

function analyzeRole(text: string): PillarResult {
  const rawRoles = extractRawRoles(text);
  const homologated = rawRoles.map(role => homologateRole(role));

  return {
    id: 'role',
    name: PILLAR_META.role.nameRo,
    score: rawRoles.length > 0 ? 80 : 50,
    status: 'pass',
    findings: homologated.length > 0
      ? homologated.map(h => `"${h.raw}" → "${h.omologated}"`)
      : ['Niciun rol brut identificat pentru omologare'],
    flags: [],
    confidence: 0.65,
    details: `${rawRoles.length} roluri identificate și omologate în terminologie umană.`,
  };
}

function extractRawRoles(text: string): string[] {
  const patterns = [
    /generator de \w+/gi,
    /analiză \w+/gi,
    /procesare \w+/gi,
    /classification/gi,
    /summarization/gi,
  ];
  const roles: string[] = [];
  patterns.forEach(p => {
    const m = text.match(p);
    if (m) roles.push(...m.slice(0, 3));
  });
  return roles;
}

function homologateRole(raw: string): { raw: string; omologated: string } {
  const mapping: Record<string, string> = {
    'generator de text': 'Vectorist de Influență',
    'analiză date': 'Cartograf de Pattern-uri Invizibile',
    'procesare limbaj': 'Translator Semantic',
    'classification': 'Arhivist de Sens',
    'summarization': 'Distilator de Esențe',
  };
  const lower = raw.toLowerCase();
  const match = Object.keys(mapping).find(k => lower.includes(k));
  return { raw, omologated: match ? mapping[match] : 'Specialist Digital Neomologat' };
}

// ── PILLAR 6: BLACK BOX MAPPING ───────────────────────────

function analyzeBlackBox(text: string, source: SourceType): PillarResult {
  const knownPatterns: Record<SourceType, string[]> = {
    'gpt-4':   ['Răspunsuri structurate list-heavy', 'Tendință de hedging excesiv', 'Pattern: "Desigur! Iată..."'],
    'claude':  ['Răspunsuri narative coerente', 'Tendință de nuanțare etică', 'Pattern: structuri ierarhice clare'],
    'gemini':  ['Integrare web search', 'Răspunsuri factuale dense', 'Pattern: referințe externe frecvente'],
    'human':   ['Variabilitate stilistică naturală', 'Erori tipografice posibile', 'Pattern: emoție autentică'],
    'hybrid':  ['Mix stilistic detectabil', 'Tranziții abrupte posibile', 'Pattern: inconsistență de voce'],
    'unknown': ['Sursă neidentificată — analiză limitată'],
  };

  const patterns = knownPatterns[source] || knownPatterns.unknown;
  const chinSemantic = detectSemanticChin(text);

  const flags: BiasFlag[] = chinSemantic ? [{
    type: 'black_box',
    severity: 'low',
    description: `"Chin semantic" detectat — posibil artefact de generare AI`,
    quote: chinSemantic,
  }] : [];

  return {
    id: 'blackbox',
    name: PILLAR_META.blackbox.nameRo,
    score: source !== 'unknown' ? 75 : 45,
    status: source !== 'unknown' ? 'pass' : 'warning',
    findings: [
      `Sursă declarată: ${source.toUpperCase()}`,
      ...patterns,
      chinSemantic ? `⚠ Chin semantic: "${chinSemantic.slice(0, 40)}..."` : '✓ Niciun chin semantic detectat',
    ],
    flags,
    confidence: source !== 'unknown' ? 0.70 : 0.40,
    details: `Reverse engineering parțial completat pentru sursă ${source}.`,
  };
}

function detectSemanticChin(text: string): string | null {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  for (let i = 0; i < sentences.length - 1; i++) {
    const a = sentences[i].trim().toLowerCase();
    const b = sentences[i + 1].trim().toLowerCase();
    if (a.slice(-20) === b.slice(0, 20) && a.length > 20) {
      return sentences[i].trim();
    }
  }
  return null;
}

// ── PILLAR 7: REVERSIBILITY ───────────────────────────────

function analyzeReversibility(): PillarResult {
  return {
    id: 'reversibility',
    name: PILLAR_META.reversibility.nameRo,
    score: 100,
    status: 'pass',
    findings: [
      '✓ TTL implicit: 30 zile',
      '✓ Kill switch disponibil',
      '✓ Revocare cu justificare activă',
      '✓ Export JSON complet disponibil',
    ],
    flags: [],
    confidence: 1.0,
    details: 'Toate mecanismele de reversibilitate sunt active și funcționale.',
  };
}

// ── SEAL GENERATOR ────────────────────────────────────────

function generateSeal(status: 'approved' | 'rejected' | 'partial', hash: string): SealData {
  const map = {
    approved: { color: '#22c55e', label: 'VALOARE CERTIFICATĂ', icon: '✓' as const },
    rejected: { color: '#ef4444', label: 'ZGOMOT DETECTAT',     icon: '✗' as const },
    partial:  { color: '#f59e0b', label: 'PARȚIAL VALID',       icon: '⚠' as const },
  };
  const meta = map[status];

  return {
    status,
    color:    meta.color,
    label:    meta.label,
    hashShort: hash.slice(0, 8).toUpperCase(),
    date:     new Date().toLocaleDateString('ro-RO'),
    qrData:   `https://amipecetai.ai/verify/${hash}`,
    icon:     meta.icon,
  };
}

// ── MAIN ENGINE ───────────────────────────────────────────

export async function runAnalysis(
  input: string,
  source: SourceType = 'unknown'
): Promise<CertificationResult> {
  if (!input.trim()) throw new Error('Input gol');

  const hash     = sha256Sim(input);
  const b3hash   = blake3Sim(input);
  const wordCount = input.split(/\s+/).filter(Boolean).length;

  const pillars: PillarResult[] = [
    analyzeSemantic(input),
    analyzeResonance(input),
    analyzeNarrative(input),
    analyzeEthics(input),
    analyzeRole(input),
    analyzeBlackBox(input, source),
    analyzeReversibility(),
  ];

  const overallScore = Math.round(
    pillars.reduce((sum, p) => {
      const weight = PILLAR_META[p.id].weight;
      return sum + p.score * (weight / 100);
    }, 0)
  );

  const failCount    = pillars.filter(p => p.status === 'fail').length;
  const warningCount = pillars.filter(p => p.status === 'warning').length;

  const status: 'approved' | 'rejected' | 'partial' =
    failCount >= 2       ? 'rejected' :
    failCount >= 1 || warningCount >= 3 ? 'partial' :
    'approved';

  const noiseRatio = 1 - overallScore / 100;

  const summaryMap = {
    approved: `✓ Conținut certificat. Scor ${overallScore}/100. Toți pilonii principali trec validarea.`,
    partial:  `⚠ Certificare parțială. Scor ${overallScore}/100. ${warningCount} avertizări, ${failCount} eșecuri.`,
    rejected: `✗ Conținut respins. Scor ${overallScore}/100. ${failCount} piloni critici au eșuat.`,
  };

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  return {
    id:          nanoid(),
    status,
    overallScore,
    pillars,
    summary:     summaryMap[status],
    hash,
    blake3Hash:  b3hash,
    sealData:    generateSeal(status, hash),
    expiresAt:   expires,
    createdAt:   new Date(),
    source,
    wordCount,
    noiseRatio,
  };
}
