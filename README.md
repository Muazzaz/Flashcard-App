# Vocab App

Agency-First Vocabulary Flashcard App — a monorepo containing:

| Package | Path | Description |
|---|---|---|
| **flashcard** | `flashcard/` | React Native + Expo Router mobile app |
| **backend** | `backend/` | Cloudflare Workers API (Hono + Drizzle + Better Auth) |

## Philosophy

This app rejects algorithmic spaced repetition (no SM-2, no FSRS). The user controls all state transitions through a strict 4-state machine:

```
NEW → (Remembered) → MASTERED   [Fast-Track]
NEW → (Forgot)     → LEARNING

LEARNING → (Remembered) → REVIEWING
REVIEWING → (Remembered) → MASTERED
ANY STATE → (Forgot)     → LEARNING
ANY STATE → (Reset)      → NEW
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Wrangler CLI (`npm install -g wrangler`)

### Install all dependencies

```bash
# From the repo root
npm install              # installs workspace root
cd flashcard && npx expo install
cd ../backend && npm install
```

### Run the mobile app

```bash
cd flashcard
npx expo start --android    # Android
npx expo start --ios        # iOS
```

### Run the backend (locally)

```bash
cd backend
cp .env.example .dev.vars   # fill in your secrets
npx wrangler dev
```

### Deploy the backend

```bash
cd backend
npx wrangler secret put DATABASE_URL
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler deploy
```

### Database migrations

```bash
cd backend
npx drizzle-kit generate    # generate SQL from schema
npx drizzle-kit push        # push to Neon DB
```

## Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`flashcard/.env.example`](flashcard/.env.example) for required secrets.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo Router (TypeScript) |
| Animations | react-native-reanimated v4 |
| State | Zustand + AsyncStorage (local-first) |
| API | Hono on Cloudflare Workers |
| Database | Neon DB (Serverless PostgreSQL) via Drizzle ORM |
| Auth | Better Auth (Google OAuth + email/password) |
| Dictionary | Free Dictionary API (dictionaryapi.dev) |
