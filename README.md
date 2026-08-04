# CleanWash

CleanWash er en enklere version af WashWorld-projektet med samme type værktøjer:

- Next.js, React og TypeScript i frontend
- React Query til data mellem frontend og backend
- ApexCharts til dashboard-graf
- Flask i backend
- MariaDB som database
- phpMyAdmin til at kigge i databasen
- Docker Compose til at starte det hele samlet

Frontendens design er holdt som et dashboard, men flowet er gjort mere overskueligt, så projektet er nemmere at forklare til eksamen.

## Start projektet

```bash
docker compose up --build
```

Når containerne kører:

- Frontend: http://localhost:3000
- Backend: http://localhost:5001
- phpMyAdmin: http://localhost:8080

## Demo-login

```text
Email: demo@cleanwash.dk
Kodeord: kodeord123
```

## Flow gennem systemet

```text
Bruger i frontend
  -> frontend/lib/api.ts
  -> Flask endpoints i backend/app.py
  -> database.py
  -> MariaDB tabeller i database/init.sql
  -> JSON tilbage til frontend
```

De vigtigste endpoints:

```text
GET  /api/locations       Henter vaskehaller
GET  /api/plans           Henter abonnementer
POST /api/sign-up         Opretter bruger
POST /api/login           Logger bruger ind
POST /api/forgot-password Sender reset-email
POST /api/reset-password  Nulstiller kodeord
GET  /api/me              Henter profil
PUT  /api/me              Opdaterer profil
GET  /api/wash-history    Henter vaskehistorik
POST /api/wash-history    Registrerer en vask
GET  /api/dashboard       Henter tal til dashboardet
```

## Projektets struktur

```text
backend/
  app.py              Flask app, endpoints og fejlhåndtering
  database.py         Små databasefunktioner
  validators.py       Input-validering

database/
  init.sql            Tabeller og testdata

frontend/
  app/                Next.js app router
  components/         Genbrugelige UI-komponenter
  hooks/              Custom React hooks
  lib/api.ts          Alle kald til backend samlet et sted
  types/app.ts        Fælles TypeScript-typer
  cypress/            E2E-test med Cypress
```

## Test

```bash
cd frontend
npm run lint
npm run build
npm run e2e
```

`npm run e2e` kræver, at frontend kører på http://localhost:3000.

## Hvorfor denne version er simplere

- Backendens endpoints ligger samlet i `backend/app.py`, så flowet er nemt at fremlægge.
- Databasekode og validering ligger stadig i egne filer, så `app.py` ikke bliver unødigt rodet.
- Frontend kalder alle endpoints fra `frontend/lib/api.ts`.
- Endpoint-navne matcher brugerflowet: opret bruger, login, profil og vaskehistorik.
- Databasen har kun de tabeller, som appen faktisk bruger.

## Krav fra eksamens-PDF

```text
Frontend:
- Component-based architecture: components/
- useState og props: CleanWashApp, AuthPanel, ProfilePanel
- useEffect: hooks/useStoredToken.ts
- Custom hook: hooks/useStoredToken.ts
- Fetch og TanStack Query: lib/api.ts og CleanWashApp
- Loading/error/empty states: LocationList og WashHistory
- Form validation: AuthPanel og validators.py
- JWT authentication: login, localStorage token og Authorization header
- Search/filter: søgning i vaskehaller
- Optimistic UI update: registrer vask opdaterer historik før server-svar
- Cypress E2E: cypress/e2e/cleanwash.cy.ts

Backend:
- REST API: app.py endpoints
- Validering af brugerinput: validators.py
- JSON responses: alle endpoints returnerer jsonify
- JWT: Flask-JWT-Extended
- Hashed passwords: generate_password_hash
- HTTP status codes: 200, 201, 400, 401, 404, 409, 503
- Welcome email: email_outbox ved signup
- Forgot password: /api/forgot-password og /api/reset-password
- Relationel database: MariaDB tabeller med foreign keys
```
