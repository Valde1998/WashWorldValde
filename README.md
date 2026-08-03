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
  -> Flask endpoint i backend/routes/
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
GET  /api/me              Henter profil
PUT  /api/me              Opdaterer profil
GET  /api/wash-history    Henter vaskehistorik
POST /api/wash-history    Registrerer en vask
GET  /api/dashboard       Henter tal til dashboardet
```

## Projektets struktur

```text
backend/
  app.py              Flask app og fejlhåndtering
  database.py         Små databasefunktioner
  validators.py       Input-validering
  routes/             API-ruter opdelt efter ansvar

database/
  init.sql            Tabeller og testdata

frontend/
  app/                Next.js app router
  components/         Genbrugelige UI-komponenter
  lib/api.ts          Alle kald til backend samlet et sted
  types/app.ts        Fælles TypeScript-typer
```

## Hvorfor denne version er simplere

- Backend er delt op i små route-filer i stedet for en meget lang fil.
- Frontend kalder alle endpoints fra `frontend/lib/api.ts`.
- Endpoint-navne matcher brugerflowet: opret bruger, login, profil og vaskehistorik.
- Databasen har kun de tabeller, som appen faktisk bruger.
