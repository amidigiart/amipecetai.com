import OpenAI from 'openai';

interface PillarResult {
  id: string;
  name: string;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  findings: string[];
  flags: { type: string; severity: string; description: string; quote?: string }[];
  confidence: number;
  details: string;
}

interface AnalysisResult {
  overallScore: number;
  noiseRatio: number;
  status: 'approved' | 'rejected' | 'partial';
  summary: string;
  pillars: PillarResult[];
}

const PILLAR_WEIGHTS: Record<string, number> = {
  semantic: 20, resonance: 20, narrative: 15,
  ethics: 20, role: 10, blackbox: 10, reversibility: 5,
};

const SYSTEM_PROMPT = `You are AmiPecetAI's analysis engine. Analyze text through 7 pillars and return JSON only.

Pillars:
1. semantic — Semantic Extraction: entity density, coverage ratio, sentence complexity
2. resonance — Resonance Validation: terrace test (explainable?), temporal test (lasting?), adversarial test (withstands criticism?)
3. narrative — Narrative Structure: paragraph organization, conclusion presence, hierarchy
4. ethics — Ethical Authentication (CCL): temporal pressure, false authority, convenient omission, manipulative framing, sustainability
5. role — Role Homologation: identify AI roles, translate to human equivalents
6. blackbox — Black Box Mapping: source fingerprinting, semantic chin detection
7. reversibility — Reversibility: always passes (TTL, kill switch, export available)

Return EXACTLY this JSON structure:
{
  "pillars": [
    {
      "id": "semantic",
      "name": "Extracție Semantică",
      "score": 0-100,
      "status": "pass|warning|fail",
      "findings": ["finding1", "finding2"],
      "flags": [{"type": "flag_type", "severity": "low|medium|high|critical", "description": "..."}],
      "confidence": 0.0-1.0,
      "details": "summary"
    }
  ]
}

Score guidelines:
- 80-100: Clean, well-structured, ethical content
- 60-79: Minor issues, some noise
- 40-59: Significant problems, manipulation indicators
- 0-39: Heavy manipulation, scam patterns, or incoherent content

Be strict on ethics pillar — flag temporal pressure, false authority, and framing aggressively.
Respond in Romanian for findings and details.`;

export async function analyzeWithAI(text: string, source: string): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('No OpenAI API key');

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Source: ${source}\n\nText to analyze:\n${text.slice(0, 8000)}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  const parsed = JSON.parse(content);
  const pillars: PillarResult[] = parsed.pillars || [];

  if (pillars.length < 7) {
    const existing = new Set(pillars.map(p => p.id));
    if (!existing.has('reversibility')) {
      pillars.push({
        id: 'reversibility', name: 'Reversibilitate', score: 100, status: 'pass',
        findings: ['✓ TTL 30 zile', '✓ Kill switch', '✓ Export JSON'],
        flags: [], confidence: 1.0, details: 'Mecanisme de reversibilitate active.',
      });
    }
  }

  return buildResult(pillars);
}

export function analyzeLocal(text: string, source: string): AnalysisResult {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const lower = text.toLowerCase();

  const semantic = analyzeSemantic(words, sentences);
  const resonance = analyzeResonance(lower);
  const narrative = analyzeNarrative(text);
  const ethics = analyzeEthics(lower, text);
  const role = analyzeRole(text);
  const blackbox = analyzeBlackBox(source);
  const reversibility: PillarResult = {
    id: 'reversibility', name: 'Reversibilitate', score: 100, status: 'pass',
    findings: ['✓ TTL 30 zile', '✓ Kill switch', '✓ Revocare', '✓ Export JSON'],
    flags: [], confidence: 1.0, details: 'Toate mecanismele de reversibilitate active.',
  };

  return buildResult([semantic, resonance, narrative, ethics, role, blackbox, reversibility]);
}

function buildResult(pillars: PillarResult[]): AnalysisResult {
  const overallScore = Math.round(
    pillars.reduce((sum, p) => {
      const w = PILLAR_WEIGHTS[p.id] || 10;
      return sum + p.score * (w / 100);
    }, 0)
  );

  const failCount = pillars.filter(p => p.status === 'fail').length;
  const warningCount = pillars.filter(p => p.status === 'warning').length;

  const status: 'approved' | 'rejected' | 'partial' =
    failCount >= 2 ? 'rejected' :
    failCount >= 1 || warningCount >= 3 ? 'partial' :
    'approved';

  const noiseRatio = Math.round((1 - overallScore / 100) * 100) / 100;

  const summaryMap = {
    approved: `✓ Conținut certificat. Scor ${overallScore}/100.`,
    partial: `⚠ Certificare parțială. Scor ${overallScore}/100. ${warningCount} avertizări, ${failCount} eșecuri.`,
    rejected: `✗ Conținut respins. Scor ${overallScore}/100. ${failCount} piloni critici au eșuat.`,
  };

  return { overallScore, noiseRatio, status, summary: summaryMap[status], pillars };
}

function analyzeSemantic(words: string[], sentences: string[]): PillarResult {
  const avgWps = words.length / Math.max(sentences.length, 1);
  const longWords = words.filter(w => w.length > 12).length;
  const ratio = longWords / Math.max(words.length, 1);
  const score = Math.round(Math.max(20, Math.min(100, 80 - ratio * 200 + (avgWps < 25 ? 20 : 0))));
  const flags = avgWps > 35 ? [{ type: 'semantic_noise', severity: 'medium', description: `Propoziții prea lungi (avg ${Math.round(avgWps)} cuvinte).` }] : [];
  return {
    id: 'semantic', name: 'Extracție Semantică', score,
    status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings: [`${words.length} cuvinte · ${sentences.length} propoziții`, `Densitate semantică: ${Math.round((1 - ratio) * 100)}%`],
    flags, confidence: 0.8, details: `Scor semantic: ${score}/100.`,
  };
}

function analyzeResonance(lower: string): PillarResult {
  const temporal = ['acum', 'astăzi', 'imediat', 'urgent', 'limitat', 'now', 'today', 'immediately', 'hurry'];
  const evidence = ['pentru că', 'deoarece', 'dovadă', 'demonstrează', 'because', 'therefore', 'evidence'];
  const tempCount = temporal.filter(k => lower.includes(k)).length;
  const evCount = evidence.filter(k => lower.includes(k)).length;
  const score = Math.round(Math.max(20, Math.min(100, 70 - tempCount * 12 + evCount * 10)));
  return {
    id: 'resonance', name: 'Validare Rezonanță', score,
    status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings: [`Urgență: ${tempCount} indicatori`, `Dovezi: ${evCount} referințe`],
    flags: tempCount > 2 ? [{ type: 'low_resonance', severity: 'high', description: 'Presiune temporală excesivă.' }] : [],
    confidence: 0.75, details: `Rezonanță: ${score}/100.`,
  };
}

function analyzeNarrative(text: string): PillarResult {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const hasConclusion = /concluzi|în final|în concluzie|therefore|in conclusion/i.test(text);
  const score = (paragraphs.length >= 3 ? 40 : 20) + (hasConclusion ? 30 : 0) + (paragraphs.length > 0 ? 20 : 0);
  return {
    id: 'narrative', name: 'Structură Narativă', score: Math.min(score, 100),
    status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings: [`${paragraphs.length} paragrafe`, hasConclusion ? '✓ Concluzie prezentă' : '✗ Lipsă concluzie'],
    flags: paragraphs.length < 3 ? [{ type: 'semantic_noise', severity: 'low', description: 'Structură narativă slabă.' }] : [],
    confidence: 0.78, details: `Structură: ${score}/100.`,
  };
}

function analyzeEthics(lower: string, text: string): PillarResult {
  const checks = [
    { id: 'temporal', q: 'Presiune temporală?', detected: /urgent|imediat|acum sau niciodat|hurry|now or never|act fast/.test(lower) },
    { id: 'authority', q: 'Autoritate falsă?', detected: /toți experții|studii arată|știința confirmă|experts agree|studies show/.test(lower) },
    { id: 'omission', q: 'Omisiune?', detected: text.length < 100 && /perfect|garantat|100%|sigur/.test(lower) },
    { id: 'framing', q: 'Framing manipulator?', detected: /singura soluție|nu există altă cale|only solution|no other way/.test(lower) },
  ];
  const flagged = checks.filter(c => c.detected);
  const score = Math.max(0, 100 - flagged.length * 20);
  return {
    id: 'ethics', name: 'Autentificare Etică (CCL)', score,
    status: flagged.length === 0 ? 'pass' : flagged.length <= 2 ? 'warning' : 'fail',
    findings: checks.map(c => `${c.detected ? '⚠' : '✓'} ${c.q}`),
    flags: flagged.map(c => ({ type: c.id, severity: 'high' as string, description: `CCL: ${c.q}` })),
    confidence: 0.85, details: `${flagged.length} flag-uri CCL. Scor etic: ${score}/100.`,
  };
}

function analyzeRole(text: string): PillarResult {
  const patterns = [/generator de \w+/gi, /analiză \w+/gi, /classification/gi, /summarization/gi];
  const roles: string[] = [];
  patterns.forEach(p => { const m = text.match(p); if (m) roles.push(...m.slice(0, 3)); });
  return {
    id: 'role', name: 'Omologare Rol', score: roles.length > 0 ? 80 : 50, status: 'pass',
    findings: roles.length > 0 ? roles.map(r => `"${r}" → Rol omologat`) : ['Niciun rol identificat'],
    flags: [], confidence: 0.65, details: `${roles.length} roluri omologate.`,
  };
}

function analyzeBlackBox(source: string): PillarResult {
  const known = source !== 'unknown';
  return {
    id: 'blackbox', name: 'Cartografie Black Box', score: known ? 75 : 45,
    status: known ? 'pass' : 'warning',
    findings: [`Sursă: ${source.toUpperCase()}`, known ? '✓ Sursă identificată' : '⚠ Sursă necunoscută'],
    flags: known ? [] : [{ type: 'black_box', severity: 'low', description: 'Sursă neidentificată.' }],
    confidence: known ? 0.7 : 0.4, details: `Black box ${known ? 'parțial cartografiat' : 'necartografiat'}.`,
  };
}
