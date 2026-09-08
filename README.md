# provet

En personlig, AI-driven studieplattform för Högskoleprovet. Adaptiv frågeträning, spaced repetition, gamification, studieplaner, fulla övningsprov och en AI-coach - byggd för att kännas som Duolingo + Strava + en riktig studiecoach.

> Frågebanken (109 frågor) och demokontona är tydligt märkta demo-data - se [Seed-data](#seed-data--demokonton) nedan.

## Snabbstart

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

**Demo-inloggning:** `demo@provet.se` / `demo1234` (har två veckors simulerad övningshistorik)
**Admin-inloggning:** `admin@provet.se` / `admin1234`

## Teknisk arkitektur

| Lager | Val |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (CSS-first, `@theme`), egna design tokens för ljust/mörkt läge |
| Databas | SQLite via Prisma ORM (bytbart till Postgres - ändra bara `provider` i `prisma/schema.prisma`) |
| Auth | NextAuth v5 (Credentials + JWT), bcrypt-hashade lösenord |
| Mutationer | Next.js Server Actions (`src/lib/actions/*`) istället för separata API-routes där möjligt |
| Animationer | Framer Motion (celebrations) + rena CSS-keyframes (steg-transitions, för stabilitet) |
| Diagram | Recharts |
| AI | Egen abstraktion (`src/lib/ai/AIService.ts`) - se nedan |

### Mappstruktur (urval)

```
prisma/
  schema.prisma        Datamodell (18 modeller)
  seed.ts               57 frågor, achievements, demo-/adminkonto, simulerad historik
src/
  app/
    (auth)/login, register
    onboarding/          5-stegs wizard + diagnostiskt test
    (app)/               Inloggat gränssnitt (dashboard, practice, plan, test, admin...)
    demo/                Testa 5 frågor utan konto
  lib/
    adaptive.ts          Elo-baserat urval av nästa fråga + spaced repetition
    estimate.ts          Räknar HP-prognos (0.00-2.00) från koncept-ratings
    gamification.ts      XP, nivåer, streaks, achievements
    studyPlan.ts          Genererar veckoplan utifrån svagheter
    ai/AIService.ts       AI-abstraktionslager (se nedan)
    actions/              Server actions: onboarding, session, test, plan, admin, ai, demo
  components/
    ui/                  Button, Card, Progress, Badge, Input
    question/            QuestionCard, hint-panel, förklaringspanel, felanalys
    dashboard/            Quick-session-picker, progress-chart, plan-rader
    admin/                Frågeformulär, ta bort-knapp
```

## AI-arkitektur

`AIService` exponerar `generateExplanation`, `generateHint`, `generateInsight`, `generateMotivation` och `analyzeTest`. Varje funktion:

1. Bygger en strukturerad prompt av **riktig användardata** (koncept-ratings, felmönster, tidsstämplar).
2. Om `ANTHROPIC_API_KEY` är satt: skickas prompten till Claude via ett rent `fetch`-anrop (`src/lib/ai/providers/anthropic.ts`).
3. Annars (eller vid fel): en **regelbaserad fallback** formaterar samma underliggande data till naturligt språk.

Det innebär att plattformen fungerar fullt ut och känns "levande" *utan* någon API-nyckel - insikterna är alltid baserade på riktiga siffror, bara mindre variation i formuleringen. Sätt `ANTHROPIC_API_KEY` i `.env` för att aktivera Claude-driven text.

Providers är utbytbara: implementera `AIProvider`-interfacet (`src/lib/ai/types.ts`) för att koppla in en annan modell.

## Adaptiv motor

- **Frågeval** (`pickNextQuestions`): rankar kandidatfrågor efter hur nära de ligger användarens "sweet spot" (~68 % chans att klara dem, ett enkelt Elo-baserat expected-score), med en bonus för koncept som är redo för spaced-repetition-repetition.
- **Rating-uppdatering**: klassisk Elo-formel (`K=32`) per koncept, lagras i `ConceptMastery`.
- **Spaced repetition**: rätt svar skjuter nästa repetition längre fram (×2.1, upp till 30 dagar), fel svar bokar in repetition samma dag.
- **Prognos** (`computeEstimate` / `computeEstimateAsOf`): mappar Elo-ratings till HP:s 0.00-2.00-skala per delprov, viktar samman till verbal/kvantitativ/total. Historiska prognospunkter räknas fram genom att spela upp svarshistoriken fram till ett givet datum - ingen separat historiktabell behövs.

Arkitekturen är medvetet utbytbar mot en mer avancerad modell (Bayesian Knowledge Tracing, IRT) utan att UI eller övriga lager behöver ändras.

## Databasschema

18 modeller i `prisma/schema.prisma`: `User`, `Profile`, `Question`, `QuestionAttempt`, `StudySession`, `Test`/`TestQuestion`/`TestAttempt`/`TestAnswer`, `StudyPlan`/`StudyPlanItem`, `Achievement`/`UserAchievement`, `XPEvent`, `ConceptMastery`, `Notification`, `AIInsight`, `Friendship`.

## Seed-data & demokonton

`npm run db:seed`:
- **57 frågor** (alla markerade `isDemo: true`) fördelat över alla åtta delprov (ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK), med koncept, svårighetsgrad, förklaringar och ledtrådar.
- **12 achievements**.
- Ett **fullständigt övningsprov** som refererar alla 57 frågor.
- **Demokonto** (`demo@provet.se`) med 14 dagars simulerad, tidstrendande övningshistorik - prognosen är räknad fram av samma algoritm som resten av appen använder (inte hårdkodad), så siffrorna hänger ihop från första sekunden.
- **Adminkonto** (`admin@provet.se`).

Kör om `npm run db:seed` när som helst för att återställa till detta tillstånd (rensar all data).

## Kärnfunktioner

- **Onboarding**: mål, provdatum, tidigare resultat, självskattning, 16-frågors diagnostiskt test → första riktiga studieprofil.
- **Adaptiv träning**: "Quick sessions" (5/10/20/30/60 min), ämnesval, spaced-repetition-repetition.
- **Fullt övningsprov**: distraktionsfri fullskärmsvy, nedräkningstimer, frågepalett, obesvarade frågor räknas som fel (som på riktiga provet), fullständig efteranalys.
- **Gamification**: XP, 10 nivåer, streaks (med "freeze"), 12 achievements.
- **Studieplan**: genereras automatiskt utifrån svagheter, justerbar per dag.
- **AI-coach**: förklaringar (4 stilar), progressiva ledtrådar (4 nivåer), insikter, motivation, provanalys.
- **Admin**: skapa/redigera/ta bort frågor, se för lätta/svåra frågor, användarstatistik.
- **Demo-läge**: testa 5 frågor utan konto på `/demo`.

## Environment-variabler

Se `.env.example`:

```bash
DATABASE_URL="file:./dev.db"       # SQLite lokalt - byt till Postgres-URL i produktion
AUTH_SECRET="..."                   # NextAuth-hemlighet, generera med `openssl rand -base64 32`
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY=""                # Valfri - aktiverar Claude-driven AI-coach
```

## Utveckling

```bash
npm run dev          # Startar dev-server
npm run db:migrate   # Kör nya migrationer
npm run db:seed      # Återställ demo-data
npm run db:studio    # Öppna Prisma Studio (bläddra i databasen)
npx tsc --noEmit      # Typkontroll
```

## Produktion

Se [DEPLOY.md](./DEPLOY.md) för fullständig steg-för-steg-guide till Vercel + hostad Postgres. Kort sammanfattning:

- Lokal SQLite-setup (`prisma/schema.prisma`) rörs inte.
- `prisma/postgres/schema.prisma` + `prisma/postgres/migrations/` är en färdig Postgres-variant.
- Vercel bygger automatiskt med npm-scriptet `vercel-build`, som kör migrationerna mot din produktionsdatabas innan `next build`.

## Känt kvarstående arbete

Detta är en fullt fungerande MVP, inte bara en mockup - alla knappar, data och beräkningar är verkliga. Vissa långsvansfunktioner ur den ursprungliga produktvisionen är medvetet nedskalade för att hålla omfånget rimligt:

- **Socialt/leaderboard**: `Friendship`-modellen finns i schemat men UI saknas.
- **Betalning/freemium**: arkitekturen är förberedd (inga hårda begränsningar hindrar det) men inget betalflöde är byggt.
- **Push-notiser**: `Notification`-modellen finns men triggas inte automatiskt ännu.
- **IRT/Bayesian Knowledge Tracing**: den nuvarande Elo-modellen är medvetet enkel och utbytbar.
