# URL Shortener

A Bitly-style URL shortener with a Spring Boot backend and Next.js frontend.

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
| `GET` | `/api/urls` | Yes | List your URLs |
| `DELETE` | `/api/urls/{id}` | Yes | Delete a URL |
| `PATCH` | `/api/urls/{id}/extend` | Yes | Extend expiry |
| `PATCH` | `/api/urls/{id}/code` | Yes | Change short code |
| `GET` | `/{shortCode}` | No | Redirect to original URL |

> Anonymous URLs expire after **7 days**. Authenticated users can set a custom expiry or none at all.

---

## Notes

- The backend reads env vars with fallback defaults, so the app runs without a `.env` file in local dev (using the defaults from `application.yml`).
- JWT tokens expire after **24 hours**.
- Authenticated requests require the header: `Authorization: Bearer <token>`
