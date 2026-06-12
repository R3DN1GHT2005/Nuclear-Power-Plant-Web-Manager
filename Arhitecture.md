# Architecture — Nuclear Power Plant Web Manager

```
/Nuclear-Power-Plant-Web-Manager
│
├── /frontend/public              # Static files (served by Nginx locally, Vercel in prod)
│   ├── index.html                       # Admin dashboard — reactor grid, KPIs, alerts, RSS
│   ├── dashboard.html                   # Manager/tech dashboard — assigned reactor, KPI, maint.
│   ├── login.html                       # Login page
│   ├── reactors.html                    # Reactor list (filterable, searchable)
│   ├── reactor.html                     # Reactor detail — sensors, readings, alerts, maintenance
│   ├── stats.html                       # Admin analytics — KPI, efficiency, risk, wear
│   ├── reactor-statistics.html          # Manager stats — own reactor
│   ├── location.html                    # Interactive map (Leaflet, polling 5s)
│   ├── management.html                  # Maintenance management (manager)
│   ├── alerts-history.html              # Resolved alerts history (admin)
│   ├── admin-accounts.html              # Admin: user management
│   │
│   └── /assets
│       ├── /css
│       │   ├── style.css                # Global styles — dark theme, layout, navbar, cards, forms
│       │   ├── alerts.css               # Alert modal styles
│       │   ├── reactor.css              # Reactor page styles
│       │   ├── location.css             # Leaflet map styles
│       │   ├── dashboard.css            # Dashboard styles
│       │   ├── admin-accounts.css       # Admin users styles
│       │   ├── station-view.css         # Station view styles
│       │   └── alerts-history.css       # Alert history styles
│       │
│       ├── /js
│       │   ├── api.js                   # API client — authFetch (auto 401→refresh), NuclearAPI
│       │   ├── login.js                 # Login handler + role-based redirect
│       │   ├── navbar.js                # Dynamic navbar — links depend on user role
│       │   ├── alerts.js                # Global alert overlay (polls every 30s)
│       │   ├── rss.js                   # RSS feed fetch + token display
│       │   ├── alerts-history.js        # Alert history page logic
│       │   │
│       │   ├── /utils
│       │   │   ├── helpers.js           # formatTime, statusClass, severityIcon, sensorIcon, etc.
│       │   │   ├── dom.js               # setElText, safeBindClick, modal helpers, toast
│       │   │   └── status.js            # Status display utilities
│       │   │
│       │   └── /features
│       │       ├── /dashboard
│       │       │   ├── dashboard-init.js        # Manager dashboard bootstrap
│       │       │   ├── dashboard-index-init.js   # Admin dashboard bootstrap
│       │       │   ├── dashboard-kpis.js         # KPI gauge cards
│       │       │   ├── dashboard-stats.js        # Efficiency chart
│       │       │   └── dashboard-feed.js         # RSS feed
│       │       │
│       │       ├── /reactors-list
│       │       │   ├── reactors-list.js          # Reactor list + filters
│       │       │   └── reactors-list-renderer.js # Reactor card DOM rendering
│       │       │
│       │       ├── /reactor
│       │       │   ├── reactor-details-init.js   # Reactor page bootstrap
│       │       │   ├── reactor-details-state.js  # Reactor page state management
│       │       │   ├── reactor-details-renderer.js # Reactor detail rendering
│       │       │   └── reactor-details-events.js # Reactor page events
│       │       │
│       │       ├── /statistics
│       │       │   ├── stats-init.js             # Admin statistics bootstrap
│       │       │   └── stats-renderer.js         # Chart.js rendering
│       │       │
│       │       ├── /stats
│       │       │   ├── stats-init.js             # Stats initialization
│       │       │   ├── stats-state.js            # Stats state management
│       │       │   ├── stats-kpi.js              # KPI charts
│       │       │   ├── stats-efficiency.js       # Efficiency charts
│       │       │   ├── stats-comparison.js       # Reactor comparison charts
│       │       │   ├── stats-risk.js             # Risk matrix charts
│       │       │   ├── stats-wear.js             # Wear analysis charts
│       │       │   └── stats-environment.js      # Environmental charts
│       │       │
│       │       ├── /location
│       │       │   ├── location-init.js          # Map bootstrap
│       │       │   ├── location-state.js         # Leaflet markers, polling, popup state
│       │       │   ├── location-map.js           # Map setup
│       │       │   ├── location-renderer.js      # Map rendering
│       │       │   ├── location-events.js        # Map events
│       │       │   ├── location-sensors.js       # Sensor overlay on map
│       │       │   └── location-reactor-form.js  # Reactor form on map
│       │       │
│       │       ├── /admin
│       │       │   ├── admin-init.js             # Admin bootstrap (AdminState singleton)
│       │       │   ├── admin-users.js            # Users table + CRUD modal
│       │       │   └── admin-assignments.js      # Reactor assignment
│       │       │
│       │       ├── /management
│       │       │   ├── management-init.js        # Management bootstrap
│       │       │   └── management-info.js        # Maintenance info
│       │       │
│       │       └── /shared
│       │           ├── alert-history-view.js     # Alert history component
│       │           ├── maintenance-view.js       # Maintenance view component
│       │           └── stats-calculator.js       # Stats calculator
│       │
│       └── alert_sound.mp3              # Sound played on new critical alert
│
├── /backend                    # PHP API (Apache, port 8082 locally, Render in prod)
│   ├── /public                 # Document Root
│   │   ├── index.php                  # Front Controller — CORS, routes, autoload
│   │   └── .htaccess                  # Apache URL rewriting (all → index.php)
│   │
│   ├── /src
│   │   ├── /Core               # Framework infrastructure
│   │   │   ├── Router.php             # Custom router — GET/POST/PUT/PATCH/DELETE + middleware chain
│   │   │   ├── Database.php           # PDO singleton (PostgreSQL/Neon, sslmode=require)
│   │   │   └── Response.php           # JSON response helper
│   │   │
│   │   ├── /Middleware         # Security chain
│   │   │   ├── AuthMiddleware.php     # JWT validation from HttpOnly cookie
│   │   │   ├── AdminMiddleware.php    # Admin role check
│   │   │   ├── ManagerOrAdminMiddleware.php # Manager or admin check
│   │   │   └── SensorMiddleware.php   # X-API-KEY validation (simulator)
│   │   │
│   │   ├── /Controllers       # Receive request → return JSON
│   │   │   ├── AuthController.php     # Login, refresh, logout, me
│   │   │   ├── ReactorController.php  # Reactor CRUD + status
│   │   │   ├── SensorController.php   # Sensor CRUD + config + readings
│   │   │   ├── AlertController.php    # Active alerts, history, resolve
│   │   │   ├── UserController.php     # User management (admin/manager)
│   │   │   ├── ReportController.php   # KPI, efficiency, trend, comparison, risk, wear
│   │   │   ├── ReactorMaintenanceController.php # Start/stop maintenance + history
│   │   │   │   └── RssController.php      # RSS token + XML feed
│   │   │
│   │   ├── /Services          # Business logic
│   │   │   ├── AuthService.php        # Password verification
│   │   │   ├── TokenService.php       # JWT access token (15min) + refresh token
│   │   │   ├── SessionService.php     # Refresh token session management
│   │   │   ├── UserService.php        # User business logic
│   │   │   ├── ReactorService.php     # Reactor CRUD + status validation
│   │   │   ├── SensorService.php      # Sensors + alert generation on threshold breach
│   │   │   ├── AlertService.php       # Alert filtering by role
│   │   │   ├── ReactorMaintenanceService.php # Maintenance cycle (transactional)
│   │   │   ├── AnalyticsService.php   # KPI, efficiency, risk, wear calculations
│   │   │   ├── CityDistanceService.php # Haversine distance reactor→cities
│   │   │   ├── DiscordNotificationService.php # Discord webhook notifications
│   │   │   └── RssService.php         # Token generation + RSS XML feed
│   │   │
│   │   ├── /Repositories     # Only classes that know SQL
│   │   │   ├── UserRepository.php
│   │   │   ├── ReactorRepository.php
│   │   │   ├── SensorRepository.php
│   │   │   ├── AlertRepository.php
│   │   │   ├── ReactorMaintenanceRepository.php
│   │   │   ├── ReactorPersonnelRepository.php
│   │   │   ├── RefreshTokenRepository.php
│   │   │   └── Maintenance_logRepository.php
│   │   │
│   │   ├── /Models           # Entities (row mapping from DB)
│   │   │   ├── User.php               # id, email, password_hash, first_name, last_name, role, rss_token
│   │   │   ├── Reactor.php            # id, name, location, status, technical params, webhook_url
│   │   │   ├── Sensor.php             # id, reactor_id, sensor_type, unit, safe values, current_value
│   │   │   ├── SensorReading.php      # id, sensor_id, recorded_value, recorded_at
│   │   │   ├── SensorConfig.php       # id, sensor_type, safe values, reactor_status, reactor_id
│   │   │   ├── Alert.php              # id, reactorId, severity, message, isResolved, resolver
│   │   │   ├── ReactorMaintenance.php # id, reactor_id, dates, reason, is_completed
│   │   │   ├── ReactorPersonnel.php   # id, user_id, reactor_id, intervention_role
│   │   │   └── Maintenance_log.php    # id, reactor_id, task_name, technician, priority, status
│   │   │
│   │   ├── /DTOs             # Data Transfer Objects
│   │   │   ├── /Request
│   │   │   │   ├── /Alert        # CreateAlertDTO, UpdateAlertDTO, ResolveAlertRequestDTO
│   │   │   │   ├── /Maintenance  # StartMaintenanceRequestDTO
│   │   │   │   ├── /Reactor      # CreateReactorRequestDTO, UpdateReactorDTO, InsertReactorDTO
│   │   │   │   ├── /Sensor       # CreateSensorRequestDTO, UpdateSensorDTO, UpdateSensorRequestDTO,
│   │   │   │   │                 # StoreMeasurementDTO, InsertSensorDTO
│   │   │   │   └── /User         # CreateUserRequestDTO, UpdateUserPasswordDTO, AssignReactorRequestDTO
│   │   │   └── /Response
│   │   │       ├── /Alert        # AlertResponseDTO, AlertHistoryResponseDTO
│   │   │       ├── /Maintenance  # MaintenanceHistoryResponseDTO
│   │   │       ├── AlertResponseDTO.php
│   │   │       ├── ReactorResponseDTO.php
│   │   │       ├── SensorResponseDTO.php
│   │   │       ├── SensorConfigDTO.php
│   │   │       ├── SensorReadingResponseDTO.php
│   │   │       └── /User         # UserResponseDTO
│   │   │
│   │   ├── /Mappers         # Model ↔ DTO converters
│   │   │   ├── ReactorMapper.php
│   │   │   ├── SensorMapper.php
│   │   │   ├── SensorConfigMapper.php
│   │   │   ├── SensorReadingMapper.php
│   │   │   ├── AlertMapper.php
│   │   │   ├── UserMapper.php
│   │   │   ├── MeasurementMapper.php
│   │   │   └── ReactorMaintenanceMapper.php
│   │   │
│   │   ├── /Enums           # PHP enums
│   │   │   ├── UserRole.php        # admin, manager, tehnician
│   │   │   ├── SensorType.php      # TEMPERATURA, PRESIUNE, VIBRATII, EFICIENTA (with profiles)
│   │   │   └── AlertSeverity.php   # warning, critical
│   │   │
│   │   ├── /Validators      # Reactor type-specific parameter validation
│   │   │   ├── ReactorValidatorInterface.php
│   │   │   ├── CanduValidator.php       # Min 400MW, city<5km reject, elev>1000m reject, seismic>6.5 reject
│   │   │   ├── PwrValidator.php         # City<5km reject, elev>1500m reject, seismic>7.0 reject
│   │   │   ├── SmrValidator.php         # Max 300MW, city<5km reject, elev>2500m reject, seismic>7.5 reject
│   │   │   └── ValidatorFactory.php     # Maps reactor type → validator
│   │   │
│   │   ├── /Clients         # External API integrations
│   │   │   ├── ElevationApiClient.php   # api.open-meteo.com/v1/elevation
│   │   │   ├── MeteostatApiClient.php   # archive-api.open-meteo.com/v1/archive — wind data
│   │   │   └── SeismicApiClient.php     # seismicportal.eu — seismic risk data
│   │   │
│   │   └── /Exceptions
│   │       └── ValidationException.php
│   │
│   ├── /data
│   │   └── worldcities.csv             # 20k+ population cities for distance validation
│   ├── composer.json                   # PSR-4 autoload App\ → src/
│   └── Dockerfile                      # php:8.2-apache + pdo_pgsql + mod_rewrite
│
├── /frontend                   # Build config + deploy
│   ├── vercel.json                    # Vercel: proxy /api/* → Render, SPA fallback
│   ├── build.js                       # Build script (generates env-config.js from env vars)
│   └── package.json                   # npm: "build" runs build.js
│
├── /init-db
│   └── schema.sql                     # Full PostgreSQL schema — 10 tables + triggers + indexes
│
├── /scripts
│   ├── simulator.py                  # Sensor data generator — Brownian motion, drift, sine, anomalies
│   └── detect_watermark.py           # Zero-width character detection in RSS text
│
├── docker-compose.yml               # Services: web (8082), frontend (4000), composer, simulator
├── Dockerfile                        # php:8.2-apache + pdo_pgsql + mod_rewrite (root app)
├── apache.conf                       # Apache VirtualHost config
├── composer.json                     # firebase/php-jwt ^7.0, vlucas/phpdotenv ^5.6
├── .env                             # DB Neon, JWT_SECRET, JWT_ISSUER, SENSOR_API_KEY, FRONTEND_API_URL
├── .gitignore
├── README.md                         # IEEE SRS in B2 English
├── Arhitecture.md                   # This document
└── comentat.md                      # Notes on commented-out middleware in index.php
```

---

## Request Flow

```
Browser → Nginx (frontend:4000 / Vercel) → static HTML/JS/CSS files
       ↓ (fetch API with credentials:include)
       Apache (backend:8082 / Render) → index.php (Front Controller)
         → Router::dispatch()
           → Middleware chain (Auth / Admin / ManagerOrAdmin / Sensor)
             → Controller
               → Service (business logic)
                 → Repository (SQL)
                   → Database (PostgreSQL / Neon)
```

## Auth Flow

```
1. POST /api/auth/login → AuthController::login
   → AuthService verifies password (password_verify)
   → TokenService generates JWT access token (HS256, 15min, HttpOnly cookie)
   → SessionService creates refresh token (random 64 hex, 30 days, DB + HttpOnly cookie)
   → JSON response with user data (redirect based on role)

2. On 401: frontend auto-calls POST /api/auth/refresh (inside authFetch wrapper)
   → TokenService decodes refresh token
   → SessionService renews session
   → New cookies set
   → Original request retried

3. Logout: POST /api/auth/logout → clears cookies + removes token from DB
```

## Alert Flow

```
Simulator → POST /api/sensors/readings (X-API-KEY header)
  → SensorController::storeMeasurement
    → SensorService compares value against min_safe_value / max_safe_value
    → If exceeded → AlertService creates alert (warning / critical)
    → DiscordNotificationService sends webhook for reactor
    → Frontend: alerts.js polls GET /api/alerts/active every 30s
      → Shows overlay + plays sound
      → Resolve: POST /api/alerts/{id}/resolve
```

## Tech Stack

| Component        | Technology                            |
|------------------|---------------------------------------|
| Frontend         | HTML5, CSS3, vanilla JavaScript       |
| Map              | Leaflet.js + OpenStreetMap            |
| Charts           | Chart.js (admin stats)                |
| Backend          | PHP 8.2+ (vanilla, no framework)      |
| Database         | PostgreSQL 16 (Neon cloud, SSL)       |
| Auth             | JWT (firebase/php-jwt ^7.0)          |
| Web server       | Apache 2.4 (backend) + Nginx (frontend local) |
| Containerization | Docker + Docker Compose               |
| Simulator        | Python 3.11 (Brownian motion, anomalies) |
| Notifications    | Discord Webhooks (per reactor)        |
| API Client       | vanilla fetch() with retry + auto refresh |

## Deployment

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| **Local** | Nginx :4000 | Apache :8082 | Neon cloud |
| **Production** | Vercel (static) | Render (Apache+PHP) | Neon cloud |

### Vercel Proxy (production)

In production, the frontend runs on Vercel and the backend on Render. To avoid CORS issues and hide the Render URL, Vercel proxies `/api/*` requests to `https://backend-nuclear.onrender.com/api/*` via `vercel.json` rewrites. The frontend always calls `/api/...` (same origin).

### API URL Resolution (frontend JS)

All JS files resolve the API base URL automatically:

```js
let baseUrl = '/api';
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    baseUrl = 'http://127.0.0.1:8082/api';
}
```

## Database (10 tables)

| Table                      | Purpose                             |
|----------------------------|-------------------------------------|
| users                      | User accounts (3 roles)             |
| refresh_tokens             | Session refresh tokens              |
| reactors                   | Nuclear reactors (tech data + location + webhook) |
| reactor_personnel          | User-to-reactor assignments         |
| sensors                    | Sensor config + current values      |
| sensor_readings            | Measurement history (time-series)   |
| alerts                     | Alerts (warning / critical)         |
| efficiency_log             | Efficiency snapshots (trigger-based)|
| reactor_maintenance        | Maintenance history per reactor     |
| maintenance_logs           | Maintenance tasks with priority     |

## User Roles

| Role       | Access                                  |
|------------|------------------------------------------|
| admin      | All reactors, all data, user management  |
| manager    | Assigned reactors, maintenance management|
| tehnician  | Assigned reactor, critical alerts only   |

## API Endpoints (40+)

- **Auth** (`/api/auth/*`): login, refresh, logout, me
- **Reactors** (`/api/reactors*`): list, by ID, my, active, by-mac, status, CRUD, statusESP, efficiency
- **Sensors** (`/api/sensors*`): types, list, config, readings (simulator), by reactor, by ID, CRUD
- **Alerts** (`/api/alerts*`): active, history, history/reactor/{id}, resolve
- **Maintenance** (`/api/reactors/{id}/maintenance*`): start, stop, personnel, history
- **Reports** (`/api/reports*`): kpi, efficiency, efficiency/trend, comparison, risk-matrix, wear
- **Users** (`/api/users*`): list, by ID, technicians, password, role, assign-reactor, rss-token/regenerate
- **RSS** (`/api/rss/*`): token, alerts feed (token auth)

## Architecture Patterns

- **Custom MVC** with Service-Repository layer separation
- **DTOs for request/response** — decouples external data from entities
- **Middleware chain** — routes pass through Auth → Admin/ManagerOrAdmin/Sensor where applicable
- **Per-type reactor validators** — CANDU, PWR, SMR have different rules (power, seismic, elevation, city distance)
- **Polling:** alerts every 30s, map every 5s, simulator every 2-3s
- **Modular frontend:** `/assets/js/features/` — code split by feature
- **Frontend utilities:** `/assets/js/utils/` — formatting helpers + DOM manipulation
- **Dynamic navbar:** links shown based on role (admin sees everything, manager/tech limited)
- **Auth wrapper:** `authFetch()` intercepts 401 and auto-refreshes the token
- **Smart simulator:** Brownian motion + drift + sine wave + anomaly injection
- **External APIs:** Open-Meteo (elevation, wind), EMSC (seismic) — validated at reactor creation
- **Discord notifications:** webhook per reactor, fired on alert creation
- **RSS feed:** per-user token, exposes alerts + history
