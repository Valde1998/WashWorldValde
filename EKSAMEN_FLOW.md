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

1. `/hjem` bruger custom hooken `useCurrentUser()`.
2. Hooken læser token fra browseren.
3. Hvis token mangler, sendes brugeren til login.
4. Hvis token findes, kalder hooken `/api/me`.
5. Backend bruger token til at finde den aktuelle bruger.
6. Backend sender brugerdata tilbage.
7. `/hjem` viser fx `user.first_name`.
8. `/hjem` kalder også `/api/locations` for at vise vaskehaller.

## Custom hook

Projektet har en custom hook i `frontend/hooks/useCurrentUser.ts`.

Den bruges på sider, hvor brugeren skal være logget ind.

Den gør fire ting:

1. Læser token fra browseren.
2. Kalder `/api/me` for at hente brugeren.
3. Gemmer `user`, `token`, `notice` og `pageLoading`.
4. Sender brugeren tilbage til login, hvis token mangler eller ikke virker.

Til eksamen kan den forklares sådan:

```txt
useCurrentUser er min custom hook.
Den samler login-tjekket, så jeg ikke skal skrive samme kode på alle medlemssider.
Siderne kan bare bruge user, token, notice og pageLoading fra hooken.
```

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
- `frontend/hooks/useCurrentUser.ts`: custom hook til login-tjek og aktuel bruger
- `frontend/lib/api.ts`: sender requests til backend
- `frontend/lib/browserSession.ts`: gemmer token og beskeder i browseren
- `backend/app.py`: Flask API og database-flow
