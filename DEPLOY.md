# Deploy till Vercel

Plattformen är förberedd för Vercel + hostad Postgres. Lokal utveckling fortsätter att använda SQLite (noll konfiguration), så den här guiden påverkar inte din lokala setup.

Hur det hänger ihop:

- `prisma/schema.prisma` - SQLite, används av `npm run dev` lokalt.
- `prisma/postgres/schema.prisma` - Postgres, används bara vid produktionsbygget på Vercel (via npm-scriptet `vercel-build`).
- Båda scheman är identiska förutom `datasource`-blocket, så du behöver aldrig hålla dem i synk manuellt om du inte ändrar datamodellen (se "Om du ändrar datamodellen" nedan).

## Steg 1 - Skapa en Postgres-databas

Enklast är **Vercel Postgres** (byggd på Neon), men vilken hostad Postgres som helst (Neon, Supabase, Railway) fungerar.

1. Gå till ditt projekt i Vercel-dashboarden → fliken **Storage** → **Create Database** → **Postgres**.
2. Vercel kopplar automatiskt in rätt miljövariabler (bland annat `DATABASE_URL`) i projektet.
   - Om du istället använder Neon/Supabase direkt: kopiera anslutningssträngen och lägg in den manuellt som `DATABASE_URL` i nästa steg.

## Steg 2 - Pusha koden till GitHub

```bash
git add -A
git commit -m "Initial commit"
```

Skapa ett nytt repo på github.com (tomt, utan README) och kör sedan:

```bash
git remote add origin https://github.com/<ditt-användarnamn>/<repo-namn>.git
git branch -M main
git push -u origin main
```

## Steg 3 - Importera projektet i Vercel

1. [vercel.com/new](https://vercel.com/new) → välj ditt GitHub-repo.
2. Vercel identifierar Next.js automatiskt. **Rör inte build-kommandot** - Vercel använder automatiskt npm-scriptet `vercel-build` som redan är konfigurerat (det kör `prisma generate` + `prisma migrate deploy` mot Postgres-schemat, sedan `next build`).
3. Under **Environment Variables**, lägg till:

   | Namn | Värde |
   |---|---|
   | `AUTH_SECRET` | Generera med `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | Din kommande produktions-URL, t.ex. `https://provet.vercel.app` |
   | `ANTHROPIC_API_KEY` | Din Claude-nyckel (valfritt - fallback fungerar utan) |
   | `DATABASE_URL` | Redan ifylld om du skapade databasen via Vercel Storage i steg 1 |

4. Klicka **Deploy**.

Första deployen kör migrationerna automatiskt och skapar alla tabeller i din nya Postgres-databas.

## Steg 4 - Seeda produktionsdatabasen (valfritt men rekommenderat för demo)

Kör lokalt, pekat mot produktionsdatabasen:

```bash
DATABASE_URL="<din-produktions-postgres-url>" npx prisma db seed --schema=prisma/postgres/schema.prisma
```

Det ger dig samma 109 demo-frågor, achievements och demo-/adminkonton i produktion som lokalt.

## Steg 5 - Verifiera

Öppna din Vercel-URL, registrera ett konto (eller logga in med `demo@provet.se` / `demo1234` om du seedat) och gå igenom onboardingen.

---

## Om du ändrar datamodellen

När du ändrar `prisma/schema.prisma` (t.ex. lägger till ett fält), gör samma ändring i `prisma/postgres/schema.prisma` och skapa en ny migration för Postgres-sidan:

```bash
npx prisma migrate diff \
  --from-migrations prisma/postgres/migrations \
  --to-schema-datamodel prisma/postgres/schema.prisma \
  --script > prisma/postgres/migrations/<timestamp>_<namn>/migration.sql
```

(Skapa mappen `prisma/postgres/migrations/<timestamp>_<namn>/` innan du kör kommandot.) Committa och pusha - `vercel-build` kör `prisma migrate deploy` automatiskt vid nästa deploy.

## Om du hellre kör allt mot en enda Postgres (även lokalt)

Peka bara `DATABASE_URL` i din lokala `.env` mot din hostade Postgres och kör `npm run dev` som vanligt - `schema.prisma` behöver då bytas till `provider = "postgresql"` precis som `prisma/postgres/schema.prisma`. De flesta väljer dock SQLite lokalt för snabbare, offline-vänlig utveckling.
