# CleanWash

CleanWash er en enklere version af WashWorld-projektet med samme type værktøjer:

- Next.js, React og TypeScript i frontend
- Flask i backend
- MariaDB som database
- phpMyAdmin til at kigge i databasen
- Docker Compose til at starte det hele samlet

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
  lib/api.ts          Alle kald til backend samlet ét sted
  types/app.ts        Fælles TypeScript-typer
```

Koden er med vilje delt i mindre filer, så hvert område har ét tydeligt ansvar.
