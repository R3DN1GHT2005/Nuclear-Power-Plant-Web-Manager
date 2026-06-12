# Software Requirements Specification — Nuclear Power Plant Web Manager

**Version 1.0** — Prepared 2026-06-12

---

## Revision History

| Name | Date | Reason for Changes | Version |
|------|------|--------------------|---------|
| Initial release | 2026-06-12 | First SRS draft | 1.0 |

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for the **Nuclear Power Plant Web Manager** (version 1.0), a full-stack web application designed for real-time monitoring, management, and analytics of nuclear reactor fleets. It covers the complete system including the frontend SPA, backend API, database layer, and simulation tooling.

### 1.2 Document Conventions

- IEEE 830-1998 template structure is followed throughout.
- Requirement identifiers follow the pattern `[FEATURE-N]` for functional and `[NFR-N]` for non-functional requirements.
- Priority levels: **High** (essential for MVP), **Medium** (important but deferrable), **Low** (nice-to-have).
- This document follows the Scholarly HTML philosophy: structured, machine-readable semantics layered atop open standards.

### 1.3 Intended Audience and Reading Suggestions

| Audience | Suggested Sections |
|---|---|
| Developers | §2 (architecture), §4 (features), §5 (constraints) |
| Project managers | §1.4 (scope), §2.2 (functions), §2.3 (users) |
| Testers | §4 (functional requirements), §5 (quality attributes) |
| Operators / Technicians | §3 (interfaces), §4.2–§4.4 (core features) |
| Security auditors | §5.3 (security), §2.5 (constraints) |

### 1.4 Product Scope

The **Nuclear Power Plant Web Manager** provides a centralized platform for:
- Real-time sensor monitoring across geographically distributed reactors.
- Alert management with severity classification (warning / critical).
- Role-based access control (admin, manager, technician).
- Maintenance lifecycle tracking.
- Analytics dashboards (efficiency, risk matrix, wear analysis, environmental impact).
- Geographic information visualization via interactive maps.
- RSS feed integration for alert dissemination.

The system serves both operational needs (technician daily tasks) and strategic oversight (manager / admin analytics and fleet-wide KPIs).

### 1.5 References

| Document | Source |
|---|---|
| IEEE 830-1998 — SRS Template | IEEE |
| Scholarly HTML Community Group | W3C — https://www.w3.org/community/scholarlyhtml/ |
| schema.org | https://schema.org |
| PHP 8.2 Documentation | https://php.net |
| PostgreSQL 16 Documentation | https://postgresql.org |
| Firebase PHP-JWT | https://github.com/firebase/php-jwt |
| Leaflet.js | https://leafletjs.com |
| Chart.js | https://chartjs.org |
| neon.tech (PostgreSQL cloud) | https://neon.tech |

---

## 2. Overall Description

### 2.1 Product Perspective

The system is a **new, self-contained product** built from scratch as a greenfield project. It replaces manual spreadsheet-based reactor monitoring with an automated, real-time web platform. The architecture follows a **client-server model** with a PHP backend serving a JSON API consumed by a vanilla JavaScript frontend.

```
┌─────────────┐     HTTP/JSON     ┌──────────────┐     SQL      ┌────────────┐
│  Browser     │ ──────────────>  │  PHP Backend  │ ──────────> │ PostgreSQL │
│ (Vanilla JS) │ <────────────── │  (Apache)     │ <────────── │  (Neon)    │
└─────────────┘                  └──────────────┘              └────────────┘
       ▲                                ▲
       │ HTTP (simulated data)          │ HTTP (elevation, seismic, wind)
       ▼                                ▼
┌─────────────┐                  ┌──────────────┐
│  Python     │                  │  External     │
│  Simulator  │                  │  APIs         │
└─────────────┘                  └──────────────┘
```

### 2.2 Product Functions

- **Authentication & Authorization** — JWT-based login with access token (15 min) + refresh token (30 days) rotation; role-based access for admin, manager, technician.
- **Reactor Management** — CRUD operations per reactor type (CANDU, PWR, SMR) with type-specific validation rules (proximity to cities, elevation limits, seismic thresholds).
- **Sensor Monitoring** — Real-time ingestion of sensor readings (temperature, pressure, vibration, efficiency); automatic alert generation on threshold breach.
- **Alert System** — Severity-based alerts (warning, critical) with resolution workflow; Discord webhook notifications; RSS feed export.
- **Maintenance Tracking** — Start/stop maintenance sessions; personnel assignment; full history with reason logging.
- **Analytics & Reports** — KPI dashboards, efficiency trends, reactor comparison, risk matrix, wear analysis, environmental metrics.
- **Geographic Visualization** — Interactive Leaflet map with reactor markers, sensor overlays, city proximity zones, elevation data.
- **RSS Feeds** — Token-protected RSS 2.0 feed for alert history; per-user token regeneration.

### 2.3 User Classes and Characteristics

| Class | Description | Privileges | Frequency |
|---|---|---|---|
| **Admin** | Full system access. Manages users, reactors, sensors, and all configurations. | All endpoints | Daily |
| **Manager** | Operational oversight. Views dashboards, analytics, alerts; manages maintenance. | Read + maintenance write | Daily |
| **Technician** | Field operator. Views assigned reactors, acknowledges alerts, records maintenance. | Read + alert resolution | Per shift |
| **Sensor (machine)** | Python simulator or ESP device. Posts sensor readings via API key. | POST readings only | Every 10 s |

### 2.4 Operating Environment

| Component | Environment |
|---|---|
| Backend runtime | PHP 8.2, Apache 2.4, Linux (Docker / Render) |
| Database | PostgreSQL 16 (neon.tech — cloud) |
| Frontend | Modern browser (Chrome, Firefox, Edge, Safari) |
| Deployment | Docker Compose (local), Vercel (frontend), Render (backend) |
| Simulator | Python 3.11, any OS |

### 2.5 Design and Implementation Constraints

- **Language**: Backend MUST be PHP 8.2+, frontend MUST be vanilla JavaScript (no framework).
- **Database**: PostgreSQL 16 with PDO. No ORM — raw SQL with prepared statements.
- **Authentication**: JWT via `firebase/php-jwt`. Access tokens in HttpOnly cookies. Refresh token rotation enforced.
- **Reactor validation**: Each reactor type (CANDU, PWR, SMR) has a dedicated validator class implementing `ReactorValidatorInterface`. Validators enforce geographic and technical constraints using external elevation, seismic, and wind APIs.
- **CORS**: Backend MUST whitelist known frontend origins (localhost, Vercel). Production uses Vercel proxy (`/api/*` → Render) to avoid CORS entirely.
- **Environment**: All secrets (DB credentials, JWT secret, API keys) in `.env` file, loaded via `vlucas/phpdotenv`.

### 2.6 User Documentation

- **`Arhitecture.md`** — System architecture, request flow, authentication flow, API endpoint reference, database schema.
- **`README.md`** (this document) — IEEE SRS covering all requirements.
- Inline code documentation headers in every source file (5-line description).

### 2.7 Assumptions and Dependencies

- External APIs (Open-Meteo, EMSC seismic) remain available and free.
- PostgreSQL Neon cloud instance maintains < 100 ms latency.
- Reactor physical locations are static (no mobile reactors).
- Sensors transmit data at minimum every 10 seconds.
- Network connectivity between all tiers is reliable.

---

## 3. External Interface Requirements

### 3.1 User Interfaces

The frontend is a **multi-page vanilla JavaScript SPA** with 12 HTML pages sharing a common CSS framework.

| Page | Route | Purpose |
|---|---|---|
| Login | `login.html` | Email + password authentication |
| Dashboard (Admin) | `index.html` | Global KPIs, reactor table, alerts panel, RSS feed |
| Dashboard (Manager) | `dashboard.html` | Reactor status grid, efficiency chart |
| Reactors List | `reactors.html` | Filterable reactor card grid |
| Reactor Detail | `reactor.html` | Single reactor view: sensors, readings, alerts, maintenance |
| Reactor Statistics | `reactor-statistics.html` | Per-reactor analytics |
| Alerts History | `alerts-history.html` | Filterable alert log with resolution details |
| Location Map | `location.html` | Interactive Leaflet map with reactor markers |
| Management | `management.html` | Maintenance overview |
| Admin Accounts | `admin-accounts.html` | User CRUD and reactor assignment |
| Statistics | `stats.html` | Full analytics suite (KPI, efficiency, comparison, risk, wear, environment) |

**UI Conventions:**
- Color-coded severity: green (nominal), yellow (warning), red (critical).
- Dark theme with DM Sans / DM Mono typography.
- Consistent navbar with role-based menu items.
- Toast notifications for operations feedback.

### 3.2 Hardware Interfaces

No direct hardware interfaces. The system communicates with sensor hardware indirectly via the Python simulator (or ESP devices) that post HTTP requests to the API.

### 3.3 Software Interfaces

| Interface | Technology | Details |
|---|---|---|
| Backend API | HTTP/JSON, RESTful | 40+ endpoints; documented in `Arhitecture.md` |
| Database | PDO / PostgreSQL 16 | Connection via `App\Core\Database` singleton |
| Elevation API | HTTP/JSON | `https://api.open-meteo.com` — elevation by lat/lng |
| Wind Archive API | HTTP/JSON | `https://archive-api.open-meteo.com` — wind speed history |
| Seismic API | HTTP/JSON | `https://www.seismicportal.eu` — nearby seismic events |
| Discord Webhook | HTTP/JSON | `POST` to configured webhook URL for critical alerts |
| JWT Library | `firebase/php-jwt` v7 | Token creation and validation |
| Environent loader | `vlucas/phpdotenv` v5 | `.env` → `$_ENV` |
| Map rendering | Leaflet.js | Interactive map with tile layers |
| Charts | Chart.js | Canvas-based interactive charts |
| RSS | RSS 2.0 XML | Token-protected alert feed |

### 3.4 Communications Interfaces

- **Protocol**: HTTP/HTTPS only.
- **Data format**: JSON for API; RSS 2.0 XML for feeds; `application/x-www-form-urlencoded` for login.
- **Authentication**: JWT in HttpOnly cookie (`token`); sensor auth via `X-API-KEY` header.
- **CORS**: Backend sends `Access-Control-Allow-Origin` matching the request origin. Vercel proxy eliminates CORS in production.
- **Encryption**: HTTPS enforced in production (Render / Vercel); self-signed certs for local Docker development.

---

## 4. System Features

### 4.1 Authentication and Authorization

**Priority: High**

#### 4.1.1 Stimulus/Response Sequences

1. User submits email + password → system validates credentials → returns JWT access token (HttpOnly cookie) + refresh token.
2. Access token expires (15 min) → client calls `/api/auth/refresh` with refresh token → new access token issued; old refresh token revoked.
3. User logs out → both tokens revoked on server.

#### 4.1.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| AUTH-1 | System MUST validate credentials against `users` table with `password_verify()` | High |
| AUTH-2 | Access tokens MUST expire in 15 minutes | High |
| AUTH-3 | Refresh tokens MUST expire in 30 days | High |
| AUTH-4 | Refresh token MUST be single-use (rotation with revocation) | High |
| AUTH-5 | System MUST enforce role-based middleware (admin, manager, technician) | High |
| AUTH-6 | Unauthenticated requests MUST receive 401 | High |
| AUTH-7 | Sensor endpoints MUST validate `X-API-KEY` header | High |

---

### 4.2 Reactor Management

**Priority: High**

#### 4.2.1 Stimulus/Response Sequences

1. Admin creates reactor → selects type (CANDU/PWR/SMR) → system validates geographic constraints (city proximity, elevation, seismic risk) → stores in DB → confirms.
2. User views reactors list → system fetches from DB → renders status cards sorted by urgency.

#### 4.2.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| REACT-1 | System MUST support three reactor types: CANDU, PWR, SMR | High |
| REACT-2 | Each type MUST have a dedicated validator implementing `ReactorValidatorInterface` | High |
| REACT-3 | CANDU validators MUST enforce: min 400 MW, city > 5 km, elevation ≤ 1000 m, seismic ≤ 6.5 | High |
| REACT-4 | PWR validators MUST enforce: city > 5 km, elevation ≤ 1500 m, seismic ≤ 7.0 | High |
| REACT-5 | SMR validators MUST enforce: max 300 MW, city > 5 km, elevation ≤ 2500 m, seismic ≤ 7.5 | High |
| REACT-6 | System MUST reject reactor creation if geographic constraints fail | High |
| REACT-7 | System MUST track reactor status (active, maintenance, offline, emergency) | Medium |

---

### 4.3 Sensor Monitoring

**Priority: High**

#### 4.3.1 Stimulus/Response Sequences

1. Simulator posts sensor readings → system validates API key → stores reading → checks thresholds → generates alert if breached → returns 201.
2. Frontend polls sensor readings → renders in real-time gauge displays.

#### 4.3.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| SENS-1 | System MUST accept sensor readings via `POST /api/sensors/readings` | High |
| SENS-2 | System MUST support sensor types: TEMPERATURA, PRESIUNE, VIBRATII, EFICIENTA | High |
| SENS-3 | System MUST generate an alert when a reading exceeds safe thresholds | High |
| SENS-4 | System MUST store every reading in `sensor_readings` with timestamp | High |
| SENS-5 | System MUST reject readings without valid `X-API-KEY` | High |

---

### 4.4 Alert System

**Priority: High**

#### 4.4.1 Stimulus/Response Sequences

1. Threshold breach → system creates alert (severity: warning or critical) → sends Discord webhook if critical → frontend picks it up on next poll (30 s interval).
2. Technician resolves alert → system logs resolver identity and timestamp.

#### 4.4.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| ALERT-1 | System MUST classify alerts as `warning` or `critical` | High |
| ALERT-2 | System MUST send critical alerts to Discord via webhook | Medium |
| ALERT-3 | System MUST allow technicians to resolve alerts with reason | High |
| ALERT-4 | System MUST expose active alerts filtered by user role | High |
| ALERT-5 | System MUST maintain full resolution history | Medium |

---

### 4.5 Maintenance Tracking

**Priority: Medium**

#### 4.5.1 Stimulus/Response Sequences

1. Manager starts maintenance for a reactor → system locks reactor to `maintenance` status → logs start time and reason.
2. Maintenance completes → system records end time, updates reactor status to `active`.

#### 4.5.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| MAINT-1 | System MUST support start and stop of maintenance sessions | High |
| MAINT-2 | Maintenance start MUST change reactor status to `maintenance` | High |
| MAINT-3 | System MUST log personnel assigned to each maintenance | Medium |
| MAINT-4 | System MUST provide maintenance history per reactor | Medium |

---

### 4.6 Analytics & Reports

**Priority: Medium**

#### 4.6.1 Stimulus/Response Sequences

1. User navigates to stats page → system computes KPIs, efficiency trends, risk matrix, wear analysis, environmental metrics → renders Chart.js visualizations.

#### 4.6.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| ANALYTICS-1 | System MUST compute fleet-wide KPIs (avg efficiency, total alerts, etc.) | High |
| ANALYTICS-2 | System MUST generate efficiency trend charts per reactor | Medium |
| ANALYTICS-3 | System MUST compute risk matrix based on sensor/alert data | Medium |
| ANALYTICS-4 | System MUST compute wear analysis from efficiency degradation | Low |
| ANALYTICS-5 | System MUST support reactor comparison side-by-side | Low |

---

### 4.7 Geographic Visualization

**Priority: Medium**

#### 4.7.1 Stimulus/Response Sequences

1. User opens location page → system fetches all reactors → renders Leaflet map with colored markers (status-coded) → popups show reactor details and recent sensor data.

#### 4.7.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| GEO-1 | System MUST display all reactors on an interactive map | High |
| GEO-2 | Map markers MUST be color-coded by reactor status | High |
| GEO-3 | Clicking a marker MUST show a popup with name, status, and recent readings | Medium |
| GEO-4 | System SHOULD overlay city proximity zones | Low |
| GEO-5 | System SHOULD display elevation contours | Low |

---

### 4.8 RSS Feeds

**Priority: Low**

#### 4.8.1 Stimulus/Response Sequences

1. User views RSS feed → system validates RSS token → returns RSS 2.0 XML of alert history.

#### 4.8.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| RSS-1 | System MUST expose alert history as RSS 2.0 | Medium |
| RSS-2 | RSS feed MUST be protected by per-user token | Medium |
| RSS-3 | Users MUST be able to regenerate their RSS token | Low |

---

## 5. Other Nonfunctional Requirements

### 5.1 Performance Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-PERF-1 | API responses (excluding analytics) MUST complete in < 500 ms p95 | High |
| NFR-PERF-2 | Analytics endpoints MUST complete in < 2 s p95 | Medium |
| NFR-PERF-3 | Frontend MUST poll active alerts every 30 s | High |
| NFR-PERF-4 | The system MUST handle 50+ concurrent sensor reading submissions per second | High |
| NFR-PERF-5 | Page load (frontend) MUST render in < 3 s on modern browsers | Medium |

### 5.2 Safety Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-SAFE-1 | Critical alerts MUST be delivered within 5 s of threshold breach | High |
| NFR-SAFE-2 | The system MUST NOT be the sole mechanism for reactor safety monitoring | High |
| NFR-SAFE-3 | All alert resolutions MUST be logged with identity and timestamp | High |

### 5.3 Security Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-SEC-1 | Passwords MUST be hashed with `password_hash()` (bcrypt) | High |
| NFR-SEC-2 | JWT access tokens MUST be stored in HttpOnly cookies | High |
| NFR-SEC-3 | All database queries MUST use prepared statements | High |
| NFR-SEC-4 | CORS MUST restrict origins to known frontend deployments | High |
| NFR-SEC-5 | Environment secrets MUST NOT be committed to version control | High |
| NFR-SEC-6 | Sensor API key MUST be validated on every reading submission | High |
| NFR-SEC-7 | Refresh tokens MUST be revoked after use (rotation) | High |

### 5.4 Software Quality Attributes

| Attribute | Requirement | Priority |
|---|---|---|
| Maintainability | PSR-4 autoloading, MVC layering, DTOs for data transfer | High |
| Portability | Docker containers for all components; PHP + vanilla JS | Medium |
| Reliability | PostgreSQL with `sslmode=require`; connection retry on failure | High |
| Usability | Role-based UI; dark theme; color-coded status indicators | Medium |
| Testability | Service layer separated from HTTP; repositories abstract DB | Medium |

### 5.5 Business Rules

| ID | Rule | Priority |
|---|---|---|
| BIZ-1 | Only admins may create or delete reactors | High |
| BIZ-2 | Only managers may start/stop maintenance sessions | High |
| BIZ-3 | Technicians may only resolve alerts (not delete) | High |
| BIZ-4 | A reactor in `maintenance` status MAY still receive sensor readings | Medium |
| BIZ-5 | Alert severity `critical` MUST trigger Discord notification | High |

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| CANDU | Canada Deuterium Uranium — heavy-water reactor type |
| PWR | Pressurized Water Reactor |
| SMR | Small Modular Reactor |
| JWT | JSON Web Token |
| KPI | Key Performance Indicator |
| RSS | Really Simple Syndication |
| SPA | Single-Page Application |
| DTO | Data Transfer Object |
| PDO | PHP Data Objects (database abstraction layer) |
| CORS | Cross-Origin Resource Sharing |

---

## Appendix B: Analysis Models

### Database Schema (10 tables)

```
users              → refresh_tokens, reactor_personnel
reactors           → sensors, alerts, efficiency_log, reactor_maintenance, reactor_personnel
sensors            → sensor_readings, sensor_config
reactor_maintenance → maintenance_logs
```

### Request Flow

```
Browser → Nginx (static files) → HTML/JS/CSS
       ↓ (API calls)
Apache → index.php → Router → Middleware (auth/role) → Controller → Service → Repository → DB
```

### Authentication Flow

```
Login → POST /api/auth/login → Validate credentials → Issue access token (15 min, HttpOnly) + refresh token (30 days)
Access token expired → POST /api/auth/refresh → Validate refresh token → Revoke old → Issue new pair
Logout → POST /api/auth/logout → Revoke refresh token
```
