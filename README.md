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

## Frontend-sider og endpoints

Hvert trin har sin egen Next.js-side i `frontend/app/(washworld)` og sin egen browseradresse:

```text
/                       Velkomst
/login                  Login
/opret-bruger           Brugeroplysninger
/medlemskab             Valg af medlemskab
/betaling               Betaling
/bekraeft-email         Emailbekræftelse
/glemt-adgangskode      Glemt adgangskode
/email-sendt            Email sendt
/nulstil-adgangskode    Nyt kodeord
/hjem                   Hjem
/aktivitet              Aktivitet og vaskehistorik
/qr-kode                Medlems-QR-kode
/vaskehaller            Søgning i alle vaskehaller
/vaskehaller/[slug]     Den valgte vaskehals detaljeside
/profil                 Profil og foretrukken vaskehal
```

Bundnavigationen bruger rigtige links, og beskyttede sider sender automatisk brugere uden en gyldig session til `/login`.

## Danske WashWorld-lokationer

Projektet indeholder 71 officielle danske WashWorld-lokationer med korrekt navn, adresse, postnummer, koordinater, åbningstid samt antal vaskehaller og Vask Selv-pladser. WashWorld beskriver dette som over 140 individuelle vaskehaller, fordi flere lokationer har to, tre eller fire haller.

Dataene er hardcoded i `backend/washworld_locations.py`, synkroniseres sikkert til MariaDB ved backendens opstart og blev senest kontrolleret 5. august 2026 mod:

https://washworld.dk/find-wash-world-vaskehal

De samme lokationer bruges i oprettelse af bruger, profilvalg og siden “Find vaskehal”. Hver detaljeside har desuden rutevejledning via de officielle koordinater. Eksisterende brugerrelationer til Tilst, Viby og Højbjerg bevares ved opdateringen.

Oprettelse kræver et gyldigt emailformat, ens emailfelter, et kodeord på mindst otte tegn, nummerplade, telefonnummer og valgt vaskehal. Første trin kontrolleres også af backend, så flowet ikke går videre ved fx en allerede brugt email. Derefter sendes et tidsbegrænset bekræftelseslink; brugeren åbner linket og bekræfter med én knap uden at skrive en kode. Kortoplysninger valideres kun i browseren og bliver ikke gemt.

## Gmail og emailbekræftelse

1. Tilbagekald altid en app-adgangskode, som er blevet delt eller vist offentligt.
2. Opret en ny Google app-adgangskode.
3. Kopiér `.env.example` til `.env`.
4. Udfyld `SMTP_USERNAME`, `SMTP_APP_PASSWORD` og `SMTP_FROM` i `.env`.
5. Genstart backend med `docker compose up --build -d`.

`.env` er ignoreret af Git og må aldrig committed. Linkets hemmelige token gemmes kun som et hash i databasen og udløber efter 15 minutter. Et nyt link kan tidligst sendes efter 60 sekunder. Emails sendes direkte via SMTP og gemmes ikke i databasen.

## API

```text
GET  /api/locations       Henter vaskehaller
GET  /api/plans           Henter medlemskaber
POST /api/sign-up         Opretter bruger
POST /api/sign-up/validate Kontrollerer første oprettelsestrin
POST /api/login           Logger bruger ind
POST /api/verify-email    Bekræfter email via link-token
POST /api/resend-verification Sender et nyt bekræftelseslink
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
