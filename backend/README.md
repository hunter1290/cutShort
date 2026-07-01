# cutShort — Backend

Spring Boot 3 (Java 17) backend for a Bitly-style URL shortener: JWT-based auth,
credential-gated link features, click tracking, and an admin dashboard API.

## Stack

- **Spring Boot 3.4** — Web, Security, Data JPA, Validation
- **PostgreSQL** — persistence (`ddl-auto: update`, no migration tool — schema is derived from entities)
- **JJWT 0.12** — JWT issuing/parsing
- **Lombok** — boilerplate (getters/setters/builders)

Requires **JDK 17** to build. If your default JDK is newer (21/25) and the build fails with
"cannot find symbol" for Lombok-generated methods, point `JAVA_HOME` at a JDK 17 install —
Lombok in this Spring Boot version doesn't reliably support newer JDKs yet:

```bash
JAVA_HOME=/path/to/jdk-17 ./mvnw clean package
```

## Running locally

```bash
# Postgres must be reachable at the configured DB_URL (defaults to localhost:5432/urlshortner)
./mvnw spring-boot:run
```

Key environment variables (see `application.yml` for full list and defaults):

| Variable | Purpose |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Postgres connection |
| `JWT_SECRET` | HMAC signing key for JWTs (must be ≥256 bits) |
| `BASE_URL` | Public base URL used to build `shortUrl` in responses |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME` | Seed credentials for the bootstrap admin account (see below) |

## Auth

Stateless JWT auth (no sessions, no CSRF — `SessionCreationPolicy.STATELESS`).

1. `POST /api/auth/register` — creates a `User` with `role = USER`, password hashed with
   BCrypt, returns a signed JWT.
2. `POST /api/auth/login` — verifies credentials via Spring Security's
   `AuthenticationManager` / `DaoAuthenticationProvider`, returns a signed JWT.
3. Every subsequent request carries `Authorization: Bearer <token>`. `JwtAuthFilter`
   (`security/JwtAuthFilter.java`) runs once per request, extracts the subject (email),
   loads the `User` via `CustomUserDetailsService`, and — if the token is valid and not
   expired — populates the `SecurityContext` with that user's authorities.
4. Authorities are derived from `User.role` (`getAuthorities()` in `entity/User.java`):
   `USER` → `ROLE_USER`, `ADMIN` → `ROLE_ADMIN`. Role isn't embedded in the JWT itself — it's
   re-read from the DB on every request, so a promotion/demotion takes effect on the user's
   very next call, not just their next login.
5. `SecurityConfig` maps route patterns to required authorities:
   - `/api/auth/**` and `GET /{code}` (the redirect) — public
   - `POST /api/urls/shorten` — public (anonymous shortening allowed; the service layer
     rejects premium fields like `customCode`/`expiresAt` for anonymous callers)
   - `/api/admin/**` — requires `ROLE_ADMIN`
   - everything else — requires any authenticated user

### Admin bootstrap

There is intentionally **no open "become admin" endpoint** — that would be a privilege
escalation hole. Instead, `config/AdminBootstrap.java` runs once at startup
(`ApplicationRunner`): if no `ADMIN`-role user exists yet, it creates/updates the user at
`ADMIN_EMAIL` with `ADMIN_PASSWORD` and grants `ADMIN`. Once at least one admin exists, that
admin can promote other registered users via `POST /api/admin/users/{id}/promote`.

## URL shortening logic (`service/UrlService.java`)

- **Code generation**: a random 7-character code drawn from
  `[a-zA-Z0-9]` (62^7 ≈ 3.5 trillion combinations), re-rolled on collision
  (`existsByShortCode` check) until unique.
- **Custom codes**: only authenticated users may pass `customCode` in the shorten request;
  anonymous callers get `403 Forbidden`. Uniqueness is still enforced (`409 Conflict` if taken).
- **Expiry**:
  - Anonymous links always expire after `app.anonymous-expiry-days` (default 7 days) —
    this bounds unauthenticated storage growth.
  - Authenticated links have no expiry by default, but the caller may set one via
    `expiresAt` in the shorten request, or extend it later via `PATCH /{code}/extend`.
- **Redirect** (`GET /{code}`, public): looks up the active, non-expired link, atomically
  increments `clickCount` via a single `UPDATE ... SET clickCount = clickCount + 1` query
  (avoids read-then-write races under concurrent hits), and issues a `302 Found` — temporary,
  not permanent, so browsers re-check the destination on every visit and click counts stay
  accurate even if the target changes.
- **Delete** is a soft delete (`active = false`); the row and its click history are retained.
- **Ownership**: mutating endpoints (`delete`, `extend`, `customize`) verify the caller owns
  the link (`ownedUrl()`), independent of the route-level auth check.

## API reference

All request/response bodies are JSON. Errors are `{ "error": "<message>" }` with a status
from `AppException` (400/401/403/404/409).

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | public | Create an account. Body: `{ email, password (≥8 chars), displayName }`. Returns `AuthResponse` (`token`, `email`, `displayName`, `role`). |
| POST | `/login` | public | Body: `{ email, password }`. Returns `AuthResponse`. |
| GET | `/me` | user | Current user's `{ email, displayName, role }`. |

### URLs — `/api/urls`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/shorten` | public* | Body: `{ originalUrl, customCode?, expiresAt? }`. `customCode`/`expiresAt` require auth (403 otherwise). Returns `UrlResponse`. |
| GET | `` | user | List the caller's own active links. |
| DELETE | `/{code}` | user, owner | Soft-delete an owned link. |
| PATCH | `/{code}/extend` | user, owner | Body: `{ days }`. Pushes `expiresAt` out by `days` from the later of now/current expiry. |
| PATCH | `/{code}/customize` | user, owner | Body: `{ newCode }`. Renames the short code (409 if taken). |

\* public, but premium fields are gated — see shortening logic above.

### Redirect

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/{code}` | public | 302 redirect to the original URL; increments click count. 404 if missing/inactive, 400 if expired. |

### Admin — `/api/admin` (requires `ROLE_ADMIN`)

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | Dashboard totals: `{ totalUsers, totalAdmins, totalUrls, totalClicks }`. |
| GET | `/users` | All users with per-user metrics: `{ id, email, displayName, role, createdAt, urlCount, totalClicks }[]`. |
| GET | `/users/{id}` | Full detail for one user: the summary fields plus `urls[]` (every link they've created, including soft-deleted ones, as `UrlResponse`). |
| DELETE | `/users/{id}` | Permanently deletes the user and cascades to their links (`User.urls` is `CascadeType.ALL, orphanRemoval = true`). 403 if `id` is the caller's own account — admins can't delete themselves through this endpoint. |
| POST | `/users/{id}/promote` | Grants `ADMIN` to the target user. Returns the updated summary. |

## Data model

- **User**: `id`, `email` (unique), `password` (BCrypt hash), `displayName`, `role`
  (`USER`/`ADMIN`), `createdAt`, `urls` (one-to-many, cascade delete).
- **Url**: `id`, `shortCode` (unique), `originalUrl`, `user` (nullable — null means created
  anonymously), `clickCount`, `createdAt`, `expiresAt` (nullable), `active` (soft-delete flag).
