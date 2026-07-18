// AmiPecetAI — Core Types

export type PillarId =
  | 'semantic'
  | 'resonance'
  | 'narrative'
  | 'ethics'
  | 'role'
  | 'blackbox'
  | 'reversibility';

export type SourceType = 'gpt-4' | 'claude' | 'gemini' | 'human' | 'hybrid' | 'unknown';

export interface BiasFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  quote?: string;
}

export interface PillarResult {
  id: PillarId;
  name: string;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  findings: string[];
  flags: BiasFlag[];
  confidence: number;
  details: string;
}

export interface CCLCheck {
  id: string;
  question: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected: boolean;
  explanation: string;
}

export interface ResonanceTest {
  id: string;
  name: string;
  desc: string;
  passed: boolean;
  score: number;
  note: string;
}

export interface SealData {
  status: 'approved' | 'rejected' | 'partial';
  color: string;
  label: string;
  hashShort: string;
  date: string;
  qrData: string;
  icon: '✓' | '✗' | '⚠';
}

export interface CertificationResult {
  id: string;
  status: 'approved' | 'rejected' | 'partial';
  overallScore: number;
  pillars: PillarResult[];
  summary: string;
  hash: string;
  blake3Hash: string;
  sealData: SealData;
  expiresAt: Date;
  createdAt: Date;
  source: SourceType;
  wordCount: number;
  noiseRatio: number;
}

export interface PillarMeta {
  nameRo: string;
  nameEn: string;
  weight: number;
  icon: string;
}

export const PILLAR_META: Record<PillarId, PillarMeta> = {
  semantic: {
    nameRo: 'Extracție Semantică',
    nameEn: 'Semantic Extraction',
    weight: 20,
    icon: '🔍',
  },
  resonance: {
    nameRo: 'Validare Rezonanță',
    nameEn: 'Resonance Validation',
    weight: 18,
    icon: '🎯',
  },
  narrative: {
    nameRo: 'Structură Narativă',
    nameEn: 'Narrative Structure',
    weight: 15,
    icon: '📐',
  },
  ethics: {
    nameRo: 'Autentificare Etică (CCL)',
    nameEn: 'Ethical Authentication (CCL)',
    weight: 20,
    icon: '⚖️',
  },
  role: {
    nameRo: 'Omologare Rol',
    nameEn: 'Role Homologation',
    weight: 10,
    icon: '🏷️',
  },
  blackbox: {
    nameRo: 'Cartografie Black Box',
    nameEn: 'Black Box Mapping',
    weight: 12,
    icon: '📦',
  },
  reversibility: {
    nameRo: 'Reversibilitate',
    nameEn: 'Reversibility',
    weight: 5,
    icon: '↩️',
  },
};

export const CCL_CHECKS = ['temporal', 'authority', 'omission', 'framing', 'sustainable'] as const;
