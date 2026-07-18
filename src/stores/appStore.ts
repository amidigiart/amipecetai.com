import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { runAnalysis } from '../lib/pillars/engine';
import type { CertificationResult, SourceType } from '../types';

interface Session {
  id: string;
  input: string;
  source: SourceType;
  result: CertificationResult;
  createdAt: Date;
  expiresAt: Date;
  deleted: boolean;
}

interface User {
  tier: 'free' | 'pro';
  stampsToday: number;
  stampsLimit: number;
  stampsResetAt: string;
}

type Tab = 'demo' | 'dashboard' | 'how';

interface AppState {
  inputText: string;
  inputSource: SourceType;
  isAnalyzing: boolean;
  currentResult: CertificationResult | null;
  sessions: Session[];
  error: string | null;
  user: User;
  activeTab: Tab;

  setInput: (text: string) => void;
  setSource: (source: SourceType) => void;
  setActiveTab: (tab: Tab) => void;
  analyze: () => Promise<void>;
  deleteSession: (id: string) => void;
  upgradeToPro: () => void;
}

function shouldResetStamps(resetAt: string): boolean {
  return new Date(resetAt) < new Date();
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      inputText: '',
      inputSource: 'unknown',
      isAnalyzing: false,
      currentResult: null,
      sessions: [],
      error: null,
      activeTab: 'demo',
      user: {
        tier: 'free',
        stampsToday: 0,
        stampsLimit: 3,
        stampsResetAt: new Date(Date.now() + 86400000).toISOString(),
      },

      setInput: (text) => set({ inputText: text, error: null }),
      setSource: (source) => set({ inputSource: source }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      analyze: async () => {
        const { inputText, inputSource, user } = get();
        if (!inputText.trim()) {
          set({ error: 'Introduceți un text pentru analiză.' });
          return;
        }

        let currentUser = { ...user };
        if (shouldResetStamps(currentUser.stampsResetAt)) {
          currentUser = {
            ...currentUser,
            stampsToday: 0,
            stampsResetAt: new Date(Date.now() + 86400000).toISOString(),
          };
        }

        if (currentUser.tier === 'free' && currentUser.stampsToday >= currentUser.stampsLimit) {
          set({
            error: `Limita zilnică atinsă (${currentUser.stampsLimit} pecete). Upgrade la Pro pentru nelimitat.`,
            user: currentUser,
          });
          return;
        }

        set({ isAnalyzing: true, error: null, currentResult: null });

        await new Promise(r => setTimeout(r, 1800));

        try {
          const result = await runAnalysis(inputText, inputSource);

          const session: Session = {
            id: result.id,
            input: inputText,
            source: inputSource,
            result,
            createdAt: new Date(),
            expiresAt: result.expiresAt,
            deleted: false,
          };

          set(state => ({
            isAnalyzing: false,
            currentResult: result,
            sessions: [session, ...state.sessions],
            user: {
              ...currentUser,
              stampsToday: currentUser.stampsToday + 1,
            },
          }));
        } catch (err) {
          set({
            isAnalyzing: false,
            error: err instanceof Error ? err.message : 'Eroare la analiză.',
          });
        }
      },

      deleteSession: (id) =>
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === id ? { ...s, deleted: true } : s
          ),
        })),

      upgradeToPro: () =>
        set(state => ({
          user: { ...state.user, tier: 'pro', stampsLimit: Infinity },
        })),
    }),
    {
      name: 'amipecetai-store',
      partialize: (state) => ({
        sessions: state.sessions,
        user: state.user,
      }),
      onRehydrate: (_state, _error) => {
        return (rehydratedState) => {
          if (!rehydratedState) return;
          rehydratedState.sessions = rehydratedState.sessions.map(s => ({
            ...s,
            createdAt: new Date(s.createdAt),
            expiresAt: new Date(s.expiresAt),
            result: {
              ...s.result,
              createdAt: new Date(s.result.createdAt),
              expiresAt: new Date(s.result.expiresAt),
            },
          }));
        };
      },
    }
  )
);
