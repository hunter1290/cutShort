# cutShort

A Bitly-style URL shortener with a Spring Boot backend and Next.js frontend — JWT auth,
credential-gated premium features, click analytics, an admin dashboard, and a Gemini-powered
AI layer for latency observability and short-code suggestions.

## Highlights

- **Instant + custom shortening** — anonymous users get a link in one request; signed-in users
  can pick a custom slug, set an exact expiry, and extend it later.
- **Click analytics dashboard** — per-link click counts, expiry timelines, and a status
  breakdown, all computed client-side from the links API (no separate analytics service).
- **Admin dashboard** — org-wide stats, per-user link/click totals, promote-to-admin, and
  user removal, gated to `ROLE_ADMIN` with a bootstrap-admin seeding mechanism.
- **Gemini AI layer** (new):
  - *Redirect latency insight* — every redirect's latency is tracked in-memory; an admin-only
    endpoint asks Gemini 2.5 Flash to summarize recent latency health and call out anomalies.
  - *AI short-code suggestions* — as you paste a URL to shorten, Gemini suggests memorable,
    URL-safe slugs based on the destination (e.g. `/anthropic-research`) as an alternative to
    the random 7-character hash.
- **Secure by default** — stateless JWT auth, BCrypt password hashing, ownership checks on
  every mutating endpoint, and soft-deletes that preserve click history.


<img width="2790" height="1452" alt="image" src="https://github.com/user-attachments/assets/090562bc-d0e9-4e75-b283-1449150f44cd" />
<img width="2806" height="1454" alt="image" src="https://github.com/user-attachments/assets/c792dd8d-8eaf-41c4-ba5f-d96e9079ac49" />
<img width="2758" height="1462" alt="image" src="https://github.com/user-attachments/assets/beb984dc-8efd-4112-97e2-b30d0ea01fc4" />
<img width="2380" height="1356" alt="image" src="https://github.com/user-attachments/assets/7d4d23e8-d7db-4e5a-bffb-80421cd181f6" />
<img width="2672" height="1558" alt="image" src="https://github.com/user-attachments/assets/2041991b-0a0d-439b-b20c-7071e7ad3397" />


  

## Prerequisites

| Tool | Version |
|------|---------|
| Java | 17 |
| Maven | via `./mvnw` (bundled) |
| Node.js | 18+ |
| Docker | for PostgreSQL |

---

## 1. Start the Database

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5432` with database `urlshortner`.

---

## 2. Configure Environment

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
# Database (defaults match docker-compose.yml — no change needed for local dev)
DB_URL=jdbc:postgresql://localhost:5432/urlshortner
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT secret — generate a secure one for production
# openssl rand -base64 64
JWT_SECRET=change-me-to-a-random-256-bit-base64-string

# Service URLs
BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=http://localhost:8080

# Gemini (optional) — powers latency insights + AI short-code suggestions.
# Leave blank to disable both features; nothing else depends on this.
GEMINI_API_KEY=
```

---

## 3. Run the Backend

Make sure `JAVA_HOME` points to Java 17:

```bash
export JAVA_HOME=/Users/tushar/Library/Java/JavaVirtualMachines/jbrsdk_jcef-17.0.14/Contents/Home
```

Then start the Spring Boot server:

```bash
cd backend
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.  
Hibernate will auto-create the tables on first run (`ddl-auto: update`).

---

## 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
urlShortner/
├── backend/                  # Spring Boot (Java 17)
│   └── src/main/java/com/urlshortner/
│       ├── controller/       # REST endpoints
│       ├── service/          # Business logic
│       ├── entity/           # JPA entities (User, Url)
│       ├── dto/              # Request/response objects
│       ├── security/         # JWT filter + user details
│       ├── config/           # Security + CORS config
│       └── exception/        # Global error handling
├── frontend/                 # Next.js + Tailwind CSS
│   ├── app/                  # Pages (home, login, register, dashboard)
│   ├── components/           # Shared UI components
│   └── lib/                  # API client + auth context
├── docker-compose.yml        # PostgreSQL service
└── .env.example              # Environment variable template
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register a new account |
| `POST` | `/api/auth/login` | No | Login, returns JWT |
| `POST` | `/api/urls/shorten` | Optional | Shorten a URL |
| `POST` | `/api/urls/suggest-code` | No | AI (Gemini) short-code suggestions for a destination URL |
| `GET` | `/api/urls` | Yes | List your URLs |
| `DELETE` | `/api/urls/{id}` | Yes | Delete a URL |
| `PATCH` | `/api/urls/{id}/extend` | Yes | Extend expiry |
| `PATCH` | `/api/urls/{id}/code` | Yes | Change short code |
| `GET` | `/api/admin/latency-insight` | Admin | AI (Gemini) summary of recent redirect latency |
| `GET` | `/{shortCode}` | No | Redirect to original URL |

> Anonymous URLs expire after **7 days**. Authenticated users can set a custom expiry or none at all.

---

## Notes

- The backend reads env vars with fallback defaults, so the app runs without a `.env` file in local dev (using the defaults from `application.yml`).
- JWT tokens expire after **24 hours**.
- Authenticated requests require the header: `Authorization: Bearer <token>`
- `GEMINI_API_KEY` is optional — without it, `suggest-code` returns an empty suggestion list
  and `latency-insight` returns stats with an "unavailable" summary instead of erroring.
