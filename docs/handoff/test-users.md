# Test Users & Seed Data

Seed the database with fixed UUIDs so IDs stay consistent across machines.

```bash
cd backend
python -m app.seed.run --reset
```

Source of truth: `backend/app/seed/data.py`

---

## Seeded users

| Role | Name | `user_profiles.id` | Email (mock) | Club |
|------|------|----------------------|--------------|------|
| Federation Admin | Grace Wanjiru | `33333333-3333-4333-8333-333333333301` | grace.wanjiru@kncl.local | — |
| League Coordinator | Daniel Otieno | `33333333-3333-4333-8333-333333333302` | peter.otieno@kncl.local | — |
| Club Admin (Nairobi) | Brian Kamau | `33333333-3333-4333-8333-333333333303` | james.kamau@kncl.local | Nairobi Chess Club |
| Club Admin (Mombasa) | Amina Hassan | `33333333-3333-4333-8333-333333333304` | amina.hassan@kncl.local | Mombasa Chess Warriors |
| Player | Elias Mwangi | `33333333-3333-4333-8333-333333333305` | elias.mwangi@kncl.local | Nairobi (registered) |
| Player | Faith Njeri | `33333333-3333-4333-8333-333333333306` | faith.njeri@kncl.local | Nairobi (registered) |
| Player | Kevin Ochieng | `33333333-3333-4333-8333-333333333307` | kevin.ochieng@kncl.local | Mombasa (registered) |

> Mock emails are for dev headers only. Real Supabase users must have a matching `user_profiles` row linked by `auth_user_id`.

---

## Mock header examples

Use with `AUTH_MOCK_ENABLED=true` in backend `.env`.

### Federation admin

```http
X-Mock-Role: FEDERATION_ADMIN
X-Mock-User-ID: 33333333-3333-4333-8333-333333333301
X-Mock-Email: grace.wanjiru@kncl.local
```

### League coordinator

```http
X-Mock-Role: LEAGUE_COORDINATOR
X-Mock-User-ID: 33333333-3333-4333-8333-333333333302
X-Mock-Email: peter.otieno@kncl.local
```

### Club admin (Nairobi)

```http
X-Mock-Role: CLUB_ADMIN
X-Mock-User-ID: 33333333-3333-4333-8333-333333333303
X-Mock-Email: james.kamau@kncl.local
```

### Player (Elias)

```http
X-Mock-Role: PLAYER
X-Mock-User-ID: 33333333-3333-4333-8333-333333333305
X-Mock-Email: elias.mwangi@kncl.local
```

### Axios mock interceptor (dev only)

```javascript
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === "true") {
  api.interceptors.request.use((config) => {
    config.headers["X-Mock-Role"] = "PLAYER";
    config.headers["X-Mock-User-ID"] = "33333333-3333-4333-8333-333333333305";
    config.headers["X-Mock-Email"] = "elias.mwangi@kncl.local";
    return config;
  });
}
```

---

## Key entity IDs

| Entity | ID | Notes |
|--------|-----|-------|
| League | `11111111-1111-4111-8111-111111111101` | Kenya National Chess League |
| Season 2026 | `11111111-1111-4111-8111-111111111103` | `registration_open=true` |
| Club Nairobi | `22222222-2222-4222-8222-222222222201` | |
| Club Mombasa | `22222222-2222-4222-8222-222222222202` | |
| Club Kisumu | `22222222-2222-4222-8222-222222222203` | |
| Player Elias | `44444444-4444-4444-8444-444444444401` | `lichess_username`, `chesscom_username` set |
| Registration (Elias) | `66666666-6666-4666-8666-666666666601` | Approved, Nairobi |
| Transfer (pending) | `77777777-7777-4777-8777-777777777701` | Kevin → Kisumu |

---

## Linking real Supabase users

For a Supabase user to work with the API:

1. User signs up / logs in via Supabase Auth
2. A `user_profiles` row must exist with `auth_user_id` = Supabase user's UUID
3. `role` must be set (`PLAYER`, `CLUB_ADMIN`, etc.)
4. For players, a `players` row must link via `user_profile_id`

New users created only in Supabase without a profile will get **403** on protected routes.
