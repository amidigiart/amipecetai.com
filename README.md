# amipecetai.ai

> **"Pune pecetea pe sens"**
Validează, certifică și autentifică orice output AI sau uman.
Zgomotul devine vizibil. Valoarea primește pecetea.

---

## Stack

| Layer      | Tehnologie                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18 + TypeScript + Vite                  |
| Styling    | Tailwind CSS 3.4                              |
| Animații   | Framer Motion                                 |
| State      | Zustand (persisted)                           |
| Backend    | Node.js + Express + TypeScript                |
| Database   | PostgreSQL 16                                 |
| Cache      | Redis 7                                       |
| AI         | OpenAI GPT-4o-mini (analiză backend)          |
| Crypto     | Blake3 + SHA-256 + Dilithium (post-quantum)   |
| Deploy     | Hetzner CX42 + Docker + Caddy (auto SSL)      |
| Securitate | GDPR Art. 17+20 + EU AI Act compliant         |

---

## Cei 7 Piloni

| # | Pilon                   | Greutate | Funcție                                    |
|---|-------------------------|----------|--------------------------------------------|
| 1 | Extracție Semantică     | 20%      | Segmentare + entități + vectori influență  |
| 2 | Validare Rezonanță      | 20%      | Test terasă + temporal + adversarial       |
| 3 | Structurare Narativă    | 15%      | Ierarhizare idei + arhetipuri              |
| 4 | Autentificare Etică     | 20%      | Checklist CCL — detectare manipulare       |
| 5 | Omologare Meserii       | 10%      | Funcție brută → Rol omologat               |
| 6 | Cartografiere Black Box | 10%      | Reverse engineering semantic parțial       |
| 7 | Reversibilitate         |  5%      | TTL + kill switch + revocare               |

---

## Structură Proiect

```
amipecetai/
├── src/
│   ├── components/
│   │   ├── seal/            # VisualSeal — pecetea animată SVG
│   │   ├── pillars/         # PillarsDisplay — cei 7 piloni
│   │   └── analysis/        # Rezultate analiză
│   ├── sections/            # Hero, Demo, How, Pricing
│   ├── lib/
│   │   └── pillars/
│   │       └── engine.ts    # Motor analiză 7 piloni
│   ├── stores/
│   │   └── appStore.ts      # Zustand store
│   ├── types/
│   │   └── index.ts         # Toate tipurile TypeScript
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   └── src/
│       └── index.ts         # Express API
├── database/
│   └── schema.sql           # PostgreSQL schema
├── docker-compose.yml
└── README.md
```

---

## Quick Start

```bash
# Frontend
npm install
npm run dev        # http://localhost:5173

# Backend
cd backend
npm install
npm run dev        # http://localhost:3001

# Full stack cu Docker
cp .env.example .env
docker-compose up -d
```

---

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql://amipecet:PASSWORD@localhost:5432/amipecetai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
FRONTEND_URL=https://amipecetai.ai
PORT=3001
NODE_ENV=production

# Docker
DB_PASSWORD=your_secure_password
PGADMIN_PASSWORD=admin
```

---

## API Endpoints

```
POST   /api/certify              — Analizează și aplică pecetea
GET    /api/sessions/:id         — Detalii sesiune
GET    /api/sessions?userId=...  — Lista sesiuni
DELETE /api/sessions/:id         — Kill switch (ștergere)
GET    /api/verify/:hash         — Verificare publică
GET    /api/gdpr/export/:userId  — Export GDPR Art. 20
DELETE /api/gdpr/delete/:userId  — Ștergere GDPR Art. 17
GET    /health                   — Health check
```

---

## Deploy Hetzner

```bash
# Server: CX42 Ubuntu 24 — €17.51/lună (shared cu tot ecosistemul)

# 1. Clone
git clone https://github.com/youruser/amipecetai
cd amipecetai

# 2. Env
cp .env.example .env && nano .env

# 3. Build & run
docker-compose up -d --build

# 4. Caddy (auto SSL)
# /etc/caddy/Caddyfile:
# amipecetai.ai {
#   reverse_proxy localhost:3000
# }
# amipecetai.ai/api/* {
#   reverse_proxy localhost:3001
# }
```

---

## Model Freemium

| Plan | Preț     | Pecete  | Valabilitate | Piloni | API   |
|------|----------|---------|--------------|--------|-------|
| Free | €0       | 3/zi    | 7 zile       | 1-4    | Nu    |
| Pro  | €19/lună | ∞       | Permanente   | 1-7    | Da    |

---

## Securitate & Compliance

- **Blake3** — fast content hashing
- **SHA-256** — standard verification
- **Dilithium** — post-quantum signatures (NIST FIPS 140-2)
- **GDPR Art. 17** — right to erasure (kill switch)
- **GDPR Art. 20** — data portability (JSON export)
- **EU AI Act** — transparency + human oversight + bias disclosure
- **Auto-expirare** — 30 zile default, configurabil

---

## Integrare Ecosistem Ami*

AmiPecetAI funcționează ca **layer de validare** pentru tot ecosistemul:

```
Amibellai output  →  AmiPecetAI  →  Pecete de autenticitate
Amiartai output   →  AmiPecetAI  →  Certificare creativă
Amiwealthai recs  →  AmiPecetAI  →  Validare etică financiară
Amiluxai content  →  AmiPecetAI  →  Verificare autenticitate
Emolinkai output  →  AmiPecetAI  →  Audit de sens
```

Un singur sistem de certificare. Tot ecosistemul certificat.

---

*Parte din ecosistemul Ami* · BRIDGRAI Foundation*
