# WashWorld

WashWorld er en mobilorienteret fullstack-app til medlemskab og bilvask. Brugerflowet følger den tilhørende Figma-prototype og samler oprettelse, medlemskab, QR-kode, vaskehistorik, vaskehaller og profil i én app.

## Teknologi

- Next.js, React og TypeScript i frontend
- TanStack Query til data mellem frontend og backend
- ApexCharts til aktivitetsgrafen
- Flask og JWT i backend
- MariaDB som database
- Docker Compose til at starte hele løsningen

## Start projektet

```bash
docker compose up --build
```

Når containerne kører:

- App: http://localhost:3000
- Backend: http://localhost:5001
- phpMyAdmin: http://localhost:8080

## Demo-login

```text
Email: demo@washworld.dk
Kodeord: kodeord123
```

## Brugerflow

1. Log ind, opret bruger eller nulstil adgangskode.
2. Vælg medlemskab og gennemfør den simulerede kortbetaling.
3. Brug medlems-QR-koden ved vaskehallen.
4. Se aktivitet, statistik og vaskehistorik.
5. Find og filtrer vaskehaller, og registrer en vask.
6. Opdater profiloplysninger eller log ud.

Oprettelse kræver et gyldigt emailformat, ens emailfelter, et kodeord på mindst otte tegn, nummerplade, telefonnummer og valgt vaskehal. Derefter sendes en 6-cifret engangskode, som skal bruges inden 15 minutter. Kortoplysninger valideres kun i browseren og bliver ikke gemt.

## Gmail og emailbekræftelse

1. Tilbagekald altid en app-adgangskode, som er blevet delt eller vist offentligt.
2. Opret en ny Google app-adgangskode.
3. Kopiér `.env.example` til `.env`.
4. Udfyld `SMTP_USERNAME`, `SMTP_APP_PASSWORD` og `SMTP_FROM` i `.env`.
5. Genstart backend med `docker compose up --build -d`.

`.env` er ignoreret af Git og må aldrig committed. Engangskoden gemmes kun som et hash i databasen, udløber efter 15 minutter og låses efter fem forkerte forsøg. En ny kode kan tidligst sendes efter 60 sekunder.

## API

```text
GET  /api/locations       Henter vaskehaller
GET  /api/plans           Henter medlemskaber
POST /api/sign-up         Opretter bruger
POST /api/login           Logger bruger ind
POST /api/verify-email    Bekræfter 6-cifret emailkode
POST /api/resend-verification Sender en ny emailkode
POST /api/forgot-password Sender nulstillingskode
POST /api/reset-password  Nulstiller kodeord
GET  /api/me              Henter profil
PUT  /api/me              Opdaterer profil
GET  /api/wash-history    Henter vaskehistorik
POST /api/wash-history    Registrerer en vask
GET  /api/dashboard       Henter aktivitetstal
```

## Projektstruktur

```text
backend/
  app.py                  Flask-app og endpoints
  database.py             Databasefunktioner
  validators.py           Servervalidering

database/
  init.sql                Tabeller og demo-data

frontend/
  app/                    Next.js App Router og globalt design
  components/mobile/      Mobilflow, appskal og bundnavigation
  hooks/                  Custom React-hooks
  lib/api.ts              Samlede API-kald
  types/app.ts            Fælles TypeScript-typer
  cypress/                E2E-tests
```

## Test

```bash
cd frontend
npm run lint
npm run build
npm run e2e

cd ../backend
python -m unittest discover -s tests
```

`npm run e2e` kræver, at appen kører på http://localhost:3000.

## Centrale eksamenspunkter

- Komponentbaseret React-arkitektur og state via hooks
- Fetch og TanStack Query med loading-, fejl- og tomme tilstande
- Klient- og servervalidering af brugerinput
- JWT-login og token i localStorage
- Søgning og filtrering af vaskehaller
- Optimistisk opdatering ved registrering af vask
- Cypress E2E-tests af login, emailvalidering og udløbet session
- REST API, korrekte HTTP-statuskoder og relationel database
- Hashede kodeord, velkomstmail og nulstilling af adgangskode
