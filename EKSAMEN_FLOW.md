# Eksamens-flow i projektet

Denne fil er den simple forklaring af systemet.

## Den korte ide

Projektet har tre vigtige lag:

1. `page.tsx` viser siden og samler data fra brugeren.
2. `useWashWorld.ts` styrer hvad der skal ske i appen.
3. `api.ts` sender data til Flask-backend.
4. `app.py` modtager data, bruger databasen og sender JSON tilbage.

Kort sagt:

```txt
side i frontend -> useWashWorld -> api.ts -> app.py -> database
database -> app.py -> api.ts -> useWashWorld -> side i frontend
```

## Eksempel: login

1. Brugeren skriver email og password på login-siden.
2. Login-siden kalder `loginUser(...)`.
3. `loginUser(...)` kalder `login(...)` i `api.ts`.
4. `api.ts` sender en POST request til `/api/login`.
5. `app.py` finder brugeren i databasen.
6. Hvis login er korrekt, sender backend `token` og `user` tilbage.
7. Frontend gemmer token i browseren og sender brugeren til `/hjem`.

## Eksempel: hjem

1. `/hjem` kalder `useWashWorld({ requireLogin: true, loadLocations: true })`.
2. `requireLogin: true` betyder, at siden kræver login.
3. `loadLocations: true` betyder, at siden skal hente vaskehaller.
4. `useWashWorld` læser token fra browseren.
5. Hvis token findes, kalder frontend `/api/me`.
6. Backend bruger token til at finde den aktuelle bruger.
7. Backend sender brugerdata tilbage.
8. `/hjem` viser fx `user.first_name`.

## Token forklaret simpelt

Et token er bare et login-bevis.

Frontend gemmer token i browseren efter login.

Når frontend kalder et beskyttet endpoint, sender den token med:

```txt
Authorization: Bearer token-her
```

Backend tjekker token, før den sender private brugerdata tilbage.

## De vigtigste filer

- `frontend/app/(washworld)/login/page.tsx`: login-siden
- `frontend/app/(washworld)/hjem/page.tsx`: forsiden efter login
- `frontend/hooks/useWashWorld.ts`: appens ene custom hook
- `frontend/lib/api.ts`: sender requests til backend
- `backend/app.py`: Flask API og database-flow
