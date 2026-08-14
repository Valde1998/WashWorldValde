# Eksamens-flow i projektet

Denne fil er den simple forklaring af systemet.

## Den korte ide

Projektet har tre vigtige lag:

1. `page.tsx` viser siden og samler data fra brugeren.
2. `api.ts` sender data til Flask-backend.
3. `app.py` modtager data, bruger databasen og sender JSON tilbage.
4. `browserSession.ts` gemmer simple ting i browseren, fx login-token.

Kort sagt:

```txt
side i frontend -> api.ts -> app.py -> database
database -> app.py -> api.ts -> side i frontend
```

## Eksempel: login

1. Brugeren skriver email og password på login-siden.
2. Login-siden kalder `login(...)` i `api.ts`.
3. `api.ts` sender en POST request til `/api/login`.
4. `app.py` finder brugeren i databasen.
5. Hvis login er korrekt, sender backend `token` og `user` tilbage.
6. Frontend gemmer token i browseren og sender brugeren til `/hjem`.

## Eksempel: hjem

1. `/hjem` læser token fra browseren.
2. Hvis token mangler, sendes brugeren til login.
3. Hvis token findes, kalder siden `/api/me`.
4. Backend bruger token til at finde den aktuelle bruger.
5. Backend sender brugerdata tilbage.
6. `/hjem` viser fx `user.first_name`.
7. `/hjem` kalder også `/api/locations` for at vise vaskehaller.

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
- `frontend/lib/api.ts`: sender requests til backend
- `frontend/lib/browserSession.ts`: gemmer token og beskeder i browseren
- `backend/app.py`: Flask API og database-flow
