# Arhitectura Proiectului - Nuclear-Power-Plant-Web-Manager

```
/Nuclear-Power-Plant-Web-Manager
│
├── /frontend/public              # Interfața Utilizator (servite de Nginx)
│   ├── index.html                       # Dashboard admin (grilă reactoare, metrici, alerte, RSS)
│   ├── dashboard.html                   # Dashboard manager/tehnician (reactor asignat, KPI, mentenanță)
│   ├── login.html                       # Autentificare
│   ├── reactors.html                    # Listă reactoare (filtrabilă, căutare)
│   ├── reactor.html                     # Detalii reactor (senzori, istoric, mentenanță)
│   ├── stats.html                       # Analytics admin (KPI, eficiență, risc, wear)
│   ├── reactor-statistics.html          # Statistici manager (reactor propriu)
│   ├── location.html                    # Hartă interactivă (Leaflet, polling 5s)
│   ├── management.html                  # Management mentenanță (manager)
│   ├── alerts-history.html              # Istoric alerte rezolvate (admin)
│   ├── admin-accounts.html              # Admin: gestionare utilizatori
│   │
│   └── /assets
│       ├── /css
│       │   ├── style.css                # Stiluri globale (dark theme, layout, navbar, carduri, formulare)
│       │   ├── alerts.css               # Stiluri alertă modal
│       │   ├── reactor.css              # Stiluri pagină reactor
│       │   ├── location.css             # Stiluri hartă Leaflet
│       │   ├── dashboard.css            # Stiluri dashboard
│       │   ├── admin-accounts.css       # Stiluri admin utilizatori
│       │   ├── station-view.css         # Stiluri stație
│       │   └── alerts-history.css       # Stiluri istoric alerte
│       │
│       ├── /js
│       │   ├── api.js                   # Client API (authFetch, NuclearAPI)
│       │   ├── login.js                 # Handler login + redirect după rol
│       │   ├── navbar.js                # Navbar dinamic (linkuri după rol)
│       │   ├── alerts.js                # Alertă overlay global (polling 30s)
│       │   ├── rss.js                   # Fetch RSS feed + token
│       │   │
│       │   ├── /utils
│       │   │   ├── helpers.js           # formatTime, statusClass, severityIcon, sensorIcon, etc.
│       │   │   └── dom.js               # setElText, safeBindClick, modal helpers, toast
│       │   │
│       │   ├── /features
│       │   │   ├── /dashboard
│       │   │   │   ├── dashboard-init.js        # Bootstrap dashboard manager
│       │   │   │   ├── dashboard-kpis.js         # Gauge carduri KPI
│       │   │   │   ├── dashboard-stats.js        # Grafic eficiență
│       │   │   │   ├── dashboard-feed.js         # Feed RSS
│       │   │   │   └── dashboard-index-init.js   # Bootstrap dashboard admin
│       │   │   │
│       │   │   ├── /reactors-list
│       │   │   │   ├── reactors-list.js          # Listă reactoare + filtre
│       │   │   │   └── reactors-list-renderer.js # Carduri reactor DOM
│       │   │   │
│       │   │   ├── /reactor
│       │   │   │   ├── reactor-init.js           # Bootstrap pagină reactor
│       │   │   │   ├── reactor-sensors.js        # Carduri senzori
│       │   │   │   └── reactor-readings.js       # Istoric citiri
│       │   │   │
│       │   │   ├── /statistics
│       │   │   │   ├── stats-init.js             # Bootstrap statistici admin
│       │   │   │   └── stats-renderer.js         # Chart.js charts
│       │   │   │
│       │   │   ├── /location
│       │   │   │   ├── location-init.js          # Bootstrap hartă
│       │   │   │   └── location-state.js         # Leaflet markers, polling, popup
│       │   │   │
│       │   │   ├── /admin
│       │   │   │   ├── admin-init.js             # Bootstrap admin (AdminState singleton)
│       │   │   │   ├── admin-users.js            # Tabel utilizatori + CRUD modal
│       │   │   │   └── admin-assignments.js      # Asignare reactoare
│       │   │   │
│       │   │   └── /management
│       │   │       ├── management-init.js        # Bootstrap management
│       │   │       └── management-info.js        # Info mentenanță
│       │   │
│       │   └── /img                     # Imagini, iconițe
│
├── /backend                    # API PHP (servit de Apache pe portul 8082)
│   ├── /public                 # Document Root
│   │   ├── index.php                  # Front Controller (CORS, rute, autoload)
│   │   ├── .htaccess                  # Apache URL rewriting
│   │   └── test_discord.php           # Script test Discord webhook
│   │
│   ├── /src
│   │   ├── /Core               # Infrastructură framework
│   │   │   ├── Router.php             # Router custom (GET, POST, PUT, PATCH, DELETE) + middleware chain
│   │   │   ├── Database.php           # Singleton PDO (PostgreSQL/Neon, sslmode=require)
│   │   │   └── Response.php           # Helper JSON response
│   │   │
│   │   ├── /Middleware         # Lanț de securitate
│   │   │   ├── AuthMiddleware.php     # Validare JWT din HttpOnly cookie
│   │   │   ├── AdminMiddleware.php    # Verificare rol admin
│   │   │   ├── ManagerOrAdminMiddleware.php # Verificare rol admin sau manager
│   │   │   └── SensorMiddleware.php   # Validare X-API-KEY (simulator)
│   │   │
│   │   ├── /Controllers       # Preiau request-ul și returnează JSON
│   │   │   ├── AuthController.php     # Login, refresh, logout, me
│   │   │   ├── ReactorController.php  # Listare reactoare (toate, my, active, by ID)
│   │   │   ├── SensorController.php   # CRUD senzori + config + citiri
│   │   │   ├── AlertController.php    # Alerte active, istoric, rezolvare
│   │   │   ├── UserController.php     # Gestionare utilizatori (admin/manager)
│   │   │   ├── ReportController.php   # KPI, eficiență, trend, comparație, risc, wear
│   │   │   ├── ReactorMaintenanceController.php # Start/stop mentenanță + istoric
│   │   │   └── RssController.php      # Token RSS + feed XML alerte
│   │   │
│   │   ├── /Services          # Business logic
│   │   │   ├── AuthService.php        # Verificare parole
│   │   │   ├── TokenService.php       # JWT access token (15min) + refresh token
│   │   │   ├── SessionService.php     # Gestionare sesiuni refresh token
│   │   │   ├── UserService.php        # Business logic utilizatori
│   │   │   ├── ReactorService.php     # Validare și CRUD reactoare + status
│   │   │   ├── SensorService.php      # Senzori + generare alerte la depășire
│   │   │   ├── AlertService.php       # Alerte cu filtrare după rol
│   │   │   ├── ReactorMaintenanceService.php # Ciclu mentenanță (tranzacțional)
│   │   │   ├── AnalyticsService.php   # Calcule KPI, eficiență, risc, wear
│   │   │   ├── CityDistanceService.php # Distanță reactoare->orașe (haversine)
│   │   │   ├── DiscordNotificationService.php # Notificări Discord webhook
│   │   │   └── RssService.php         # Token generation + RSS XML feed
│   │   │
│   │   ├── /Repositories     # Singurele clase care știu SQL
│   │   │   ├── UserRepository.php
│   │   │   ├── ReactorRepository.php
│   │   │   ├── SensorRepository.php
│   │   │   ├── AlertRepository.php
│   │   │   ├── ReactorMaintenanceRepository.php
│   │   │   ├── ReactorPersonnelRepository.php
│   │   │   ├── RefreshTokenRepository.php
│   │   │   └── Maintenance_logRepository.php
│   │   │
│   │   ├── /Models           # Entități (mapare rânduri din baza de date)
│   │   │   ├── User.php                # id, email, password_hash, first_name, last_name, role, rss_token
│   │   │   ├── Reactor.php             # id, name, locație, status, parametri tehnici, webhook_url
│   │   │   ├── Sensor.php              # id, reactor_id, sensor_type, unit, valori sigure, current_value
│   │   │   ├── SensorReading.php       # id, sensor_id, recorded_value, recorded_at
│   │   │   ├── SensorConfig.php        # id, sensor_type, valori sigure, reactor_status, reactor_id
│   │   │   ├── Alert.php               # id, reactorId, severity, message, isResolved, resolver
│   │   │   ├── ReactorMaintenance.php  # id, reactor_id, dates, reason, is_completed
│   │   │   ├── ReactorPersonnel.php    # id, user_id, reactor_id, intervention_role
│   │   │   └── Maintenance_log.php     # id, reactor_id, task_name, technician, prioritate, status
│   │   │
│   │   ├── /DTOs             # Data Transfer Objects
│   │   │   ├── /request
│   │   │   │   ├── /alert        # CreateAlertDTO, UpdateAlertDTO, ResolveAlertRequestDTO
│   │   │   │   ├── /maintenance  # StartMaintenanceRequestDTO
│   │   │   │   ├── /reactor      # CreateReactorRequestDTO, UpdateReactorDTO, InsertReactorDTO
│   │   │   │   ├── /sensor       # CreateSensorRequestDTO, UpdateSensorDTO, StoreMeasurementDTO, InsertSensorDTO
│   │   │   │   └── /user         # CreateUserRequestDTO, UpdateUserPasswordDTO, AssignReactorRequestDTO
│   │   │   └── /response     # ReactorResponseDTO, SensorResponseDTO, SensorConfigDTO, AlertResponseDTO
│   │   │
│   │   ├── /Mappers         # Convertor între Modeluri și DTO-uri
│   │   │   ├── ReactorMapper.php
│   │   │   ├── SensorMapper.php
│   │   │   ├── SensorConfigMapper.php
│   │   │   ├── SensorReadingMapper.php
│   │   │   ├── AlertMapper.php
│   │   │   ├── UserMapper.php
│   │   │   ├── MeasurementMapper.php
│   │   │   └── ReactorMaintenanceMapper.php
│   │   │
│   │   ├── /Enums           # Enum-uri PHP
│   │   │   ├── UserRole.php         # admin, manager, tehnician
│   │   │   ├── SensorType.php       # TEMPERATURA, PRESIUNE, VIBRATII, EFICIENTA (cu profiluri)
│   │   │   ├── AlertSeverity.php    # warning, critical
│   │   │   └── CoolingWaterSource.php # RÂURI, LACURI, MARE, CICLU_ÎNCHIS, RACIRE_CU_AER
│   │   │
│   │   ├── /Validators      # Validare parametri specifici tip reactor
│   │   │   ├── ReactorValidatorInterface.php
│   │   │   ├── CanduValidator.php       # Min 400MW, city<5km reject, elev>1000m reject, seismic>6.5 reject
│   │   │   ├── PwrValidator.php         # City<5km reject, elev>1500m reject, seismic>7.0 reject
│   │   │   ├── SmrValidator.php         # Max 300MW, city<5km reject, elev>2500m reject, seismic>7.5 reject
│   │   │   └── ValidatorFactory.php     # Mapare tip→validator
│   │   │
│   │   ├── /Clients         # Integrări API externe
│   │   │   ├── ElevationApiClient.php   # api.open-meteo.com/v1/elevation — altitudine locație
│   │   │   ├── MeteostatApiClient.php   # archive-api.open-meteo.com/v1/archive — vânt maxim
│   │   │   └── SeismicApiClient.php     # seismicportal.eu — risc seismic
│   │   │
│   │   └── /Exceptions
│   │       └── ValidationException.php
│   │
│   ├── /data
│   │   └── worldcities.csv           # Date orașe 20k+ populație pentru distanțe
│   └── composer.json                 # Autoload PSR-4 App\ → src/
│
├── /init-db
│   └── schema.sql                    # Schema completă PostgreSQL (10 tabele)
│
├── /scripts
│   ├── simulator.py                  # Generator date senzori (Brownian motion, drift, sine, anomalii)
│   └── detect_watermark.py           # Detectare caractere zero-width în RSS
│
├── docker-compose.yml               # Servicii: web (8082), frontend (4000), composer, simulator
├── Dockerfile                        # php:8.2-apache + pdo_pgsql + mod_rewrite
├── apache.conf                       # VirtualHost config Apache
├── composer.json                     # firebase/php-jwt ^7.0, vlucas/phpdotenv ^5.6
├── .env                             # DB Neon, JWT_SECRET, JWT_ISSUER, SENSOR_API_KEY
├── .gitignore
├── Arhitecture.md                   # Acest document
├── comentat.md                      # Middleware comentat în index.php
└── fixStatistics.md                 # Propunere eficiență: tabel efficiency_log
```

---

## Fluxul unei cereri

```
Browser → Nginx (frontend:4000) → fișiere HTML/JS/CSS statice
       ↓ (fetch API cu credentials:include)
       Apache (backend:8082) → index.php (Front Controller)
         → Router::dispatch()
           → Middleware chain (Auth/Admin/ManagerOrAdmin/Sensor)
             → Controller
               → Service (business logic)
                 → Repository (SQL)
                   → Database (PostgreSQL/Neon)
```

## Fluxul de autentificare

```
1. POST /api/auth/login → AuthController::login
   → AuthService verifică parola (password_verify)
   → TokenService generează JWT access token (HS256, 15min, HttpOnly cookie, scope /api)
   → SessionService creează refresh token (random 64 hex, 30 zile, DB + HttpOnly cookie, scope /api/auth)
   → Răspuns JSON cu date utilizator (redirect conform rol)

2. La 401: frontendul face POST /api/auth/refresh (automat în authFetch wrapper)
   → TokenService decodează refresh token
   → SessionService reînnoiește sesiunea
   → Cookie-uri noi setate
   → Request-ul original se reîncearcă

3. Logout: POST /api/auth/logout → șterge cookie-urile + token-ul din DB
```

## Fluxul de alerte

```
Simulator → POST /api/sensors/readings (X-API-KEY)
  → SensorController::storeMeasurement
    → SensorService verifică valoarea față de min_safe_value / max_safe_value
    → Dacă depășit → AlertService creează alertă (warning/critical)
    → DiscordNotificationService trimite notificare pe webhook-ul reactorului
    → Frontend: alerts.js pollingează GET /api/alerts/active la 30s
      → Afișează overlay + redă sunet
      → Rezolvare: POST /api/alerts/{id}/resolve
```

## Stack tehnologic

| Componentă        | Tehnologie                            |
|-------------------|---------------------------------------|
| Frontend          | HTML5, CSS3, JavaScript vanilla       |
| Hartă             | Leaflet.js + OpenStreetMap            |
| Grafice           | Chart.js (stats admin)                |
| Backend           | PHP 8.2+ (vanilla, fără framework)    |
| Baza date         | PostgreSQL 16 (Neon cloud, SSL)       |
| Autentificare     | JWT (firebase/php-jwt ^7.0)          |
| Server web        | Apache 2.4 (backend) + Nginx (frontend) |
| Containerizare    | Docker + Docker Compose               |
| Simulator         | Python 3.11 (Brownian motion, anomalii) |
| Notificări        | Discord Webhooks (per reactor)        |
| API Client        | fetch() vanilla cu retry logic + refresh auto |

## Baza de date (10 tabele)

| Tabelă                      | Rol                                |
|-----------------------------|------------------------------------|
| users                       | Conturi utilizatori (3 roluri)     |
| refresh_tokens              | Tokeni de reîmprospătare sesiune   |
| reactors                    | Reactoare nucleare (date tehnice + locație + webhook) |
| reactor_personnel           | Asignare utilizatori la reactoare  |
| sensors                     | Configurație senzori + valori      |
| sensor_readings             | Istoric măsurători (time-series)   |
| alerts                      | Alerte (warning/critical)          |
| reactor_maintenance         | Istoric mentenanță reactoare       |
| maintenance_logs            | Task-uri de mentenanță (cu prioritate) |
| reactor_maintenance_history | Istoric complet mentenanță         |

## Roluri utilizator

| Rol        | Acces                                  |
|------------|----------------------------------------|
| admin      | Toate reactoarele, toate datele, gestionare utilizatori |
| manager    | Reactoare asignate, management mentenanță |
| tehnician  | Reactor asignat, doar alerte critice  |

## API Endpoints (40+)

- **Autentificare** (`/api/auth/*`): login, refresh, logout, me
- **Reactoare** (`/api/reactors*`): listă, by ID, my, active (simulator)
- **Senzori** (`/api/sensors*`): types, listă, by reactor, by ID, config (simulator), readings (simulator)
- **Alerte** (`/api/alerts*`): active, history, resolve
- **Mentenanță** (`/api/reactors/{id}/maintenance*`): start, stop, history
- **Rapoarte** (`/api/reports*`): kpi, efficiency, trend, comparison, risk-matrix, wear
- **Utilizatori** (`/api/users*`): listă, by ID, technicians, password, role, assign-reactor
- **RSS** (`/api/rss/*`): token, alerts feed (token auth)
- **Rute comentate** (dezactivate temporar): register, password reset, CRUD reactoare/senzori

## Patterns

- **Arhitectură:** MVC custom cu layer de Service-Repository
- **DTO-uri pentru request/response:** separă datele externe de entități
- **Middleware chain:** rutare prin Auth → Admin/ManagerOrAdmin/Sensor (unde e cazul)
- **Validator per tip reactor:** CANDU, PWR, SMR au parametri diferiți (putere, seismic, altitudine, distanță oraș)
- **Polling:** alerte la 30s, hartă la 5s, simulator la 2-3s
- **Modularizare frontend:** `/assets/js/features/` — cod separat pe module funcționale
- **Utilitare frontend:** `/assets/js/utils/` — helpers formatare + manipulare DOM
- **Navbar dinamic:** linkuri afișate conform rol (admin vede tot, manager/tehnician limitat)
- **Auth wrapper:** `authFetch()` interceptează 401 și reîmprospătează automat token-ul
- **Simulator inteligent:** mișcare Browniană + drift + variație sinusoidală + injecție anomalii
- **API externi:** Open-Meteo (elevație, vânt), EMSC (seismic) — validați la creare reactor
- **Notificări Discord:** webhook configurat per reactor, trimite la creare alertă
- **RSS feed:** bazat pe token unic per utilizator, expune alerte + istoric
