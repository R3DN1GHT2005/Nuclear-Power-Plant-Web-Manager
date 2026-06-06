# Arhitectura Proiectului - NuclearWatch

```
/proiect-centrala-nucleara
│
├── /frontend/public              # Interfața Utilizator (fișiere statice servite de Nginx)
│   ├── index.html                       # Dashboard principal (grilă reactoare, metrici, alerte)
│   ├── login.html                       # Autentificare
│   ├── register.html                    # Înregistrare utilizator
│   ├── forgetpassword.html              # Resetare parolă (2 pași)
│   ├── reactors.html                    # Listă reactoare (filtrabilă, căutare)
│   ├── reactor.html                     # Detalii reactor (senzori, istoric, mentenanță)
│   ├── stats.html                       # Analytics & rapoarte (KPI, eficiență, risc)
│   ├── location.html                    # Hartă interactivă (Leaflet)
│   ├── alerts.html                      # Management mentenanță
│   ├── admin-accounts.html              # Admin: gestionare utilizatori
│   ├── feed.xml                         # (Opțional) RSS feed
│   │
│   └── /assets
│       ├── /css
│       │   ├── style.css                # Stiluri globale
│       │   ├── alerts.css               # Stiluri alertă modal
│       │   ├── reactor.css              # Stiluri pagină reactor
│       │   ├── location.css             # Stiluri hartă
│       │   └── admin-accounts.css       # Stiluri admin
│       │
│       ├── /js
│       │   ├── api.js                   # Client API (authFetch, NuclearAPI)
│       │   ├── auth.js                  # Autentificare/login/register
│       │   ├── login.js                 # Handler login alternativ
│       │   ├── app.js                   # Dashboard principal
│       │   ├── dashboard.js             # Metrici și tabel reactoare
│       │   ├── reactors.js              # Listă reactoare
│       │   ├── reactor-details.js       # Detalii reactor individual
│       │   ├── stats.js                 # Analytics (KPI, chart SVG, risc)
│       │   ├── location.js              # Hartă Leaflet
│       │   ├── alerts.js                # Alertă overlay (polling 5s)
│       │   ├── admin-accounts.js        # Admin utilizatori
│       │   ├── polling.js               # (Neimplementat)
│       │   └── charts.js                # (Neimplementat)
│       │
│       └── /img                         # Imagini, iconițe
│
├── /backend                    # API PHP (servit de Apache pe portul 8082)
│   ├── /public                 # Document Root
│   │   ├── index.php                  # Front Controller (definește rutele, CORS)
│   │   └── .htaccess                  # Apache URL rewriting
│   │
│   ├── /src
│   │   ├── /Core               # Infrastructură framework
│   │   │   ├── Router.php             # Router custom (GET, POST, PUT, PATCH, DELETE)
│   │   │   ├── Database.php           # Singleton PDO (PostgreSQL/Neon)
│   │   │   └── Response.php           # Helper JSON response
│   │   │
│   │   ├── /Middleware         # Lanț de securitate
│   │   │   ├── AuthMiddleware.php     # Validare JWT din HttpOnly cookie
│   │   │   ├── AdminMiddleware.php    # Verificare rol admin
│   │   │   └── SensorMiddleware.php   # Validare X-API-KEY (simulator)
│   │   │
│   │   ├── /Controllers       # Preiau request-ul și returnează JSON
│   │   │   ├── AuthController.php     # Login, refresh, logout
│   │   │   ├── ReactorController.php  # CRUD reactoare
│   │   │   ├── SensorController.php   # CRUD senzori + simulare
│   │   │   ├── AlertController.php    # Alerte active, rezolvare
│   │   │   ├── UserController.php     # Gestionare utilizatori (admin)
│   │   │   ├── ReportController.php   # KPI, eficiență, risc, wear
│   │   │   ├── ReactorMaintenanceController.php # Start/stop mentenanță
│   │   │   ├── MonitorController.php  # (Neimplementat)
│   │   │   ├── Maintenance_logController.php   # (Neimplementat)
│   │   │   └── RssController.php      # (Neimplementat)
│   │   │
│   │   ├── /Services          # Business logic
│   │   │   ├── AuthService.php        # Verificare parole
│   │   │   ├── TokenService.php       # JWT access token (15min) + refresh
│   │   │   ├── SessionService.php     # Gestionare sesiuni refresh token
│   │   │   ├── UserService.php        # Business logic utilizatori
│   │   │   ├── ReactorService.php     # Validare și CRUD reactoare
│   │   │   ├── SensorService.php      # Senzori + generare alerte la depășire
│   │   │   ├── AlertService.php       # Alerte cu filtrare după rol
│   │   │   ├── ReactorMaintenanceService.php # Ciclu mentenanță
│   │   │   ├── AnalyticsService.php   # Calcule KPI, eficiență, risc
│   │   │   ├── CityDistanceService.php # Distanță reactoare->orașe
│   │   │   ├── DiscordNotificationService.php # Notificări Discord
│   │   │   ├── MonitorService.php     # (Neimplementat)
│   │   │   └── Maintenance_log.php    # (Neimplementat)
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
│   │   │   ├── User.php
│   │   │   ├── Reactor.php
│   │   │   ├── Sensor.php
│   │   │   ├── Alert.php
│   │   │   ├── ReactorMaintenance.php
│   │   │   ├── ReactorPersonnel.php
│   │   │   └── Maintenance_log.php
│   │   │
│   │   ├── /DTOs             # Data Transfer Objects
│   │   │   ├── /request
│   │   │   │   ├── /alert        # CreateAlertDTO, UpdateAlertDTO, ResolveAlertRequestDTO
│   │   │   │   ├── /maintenance  # StartMaintenanceRequestDTO
│   │   │   │   ├── /reactor      # CreateReactorRequestDTO, UpdateReactorDTO, InsertReactorDTO
│   │   │   │   ├── /sensor       # CreateSensorRequestDTO, UpdateSensorDTO, StoreMeasurementDTO
│   │   │   │   └── /user         # CreateUserRequestDTO, UpdateUserPasswordDTO, AssignReactorRequestDTO
│   │   │   └── /response     # ReactorResponseDTO, SensorResponseDTO, AlertResponseDTO, etc.
│   │   │
│   │   ├── /Mappers         # Convertor între Modeluri și DTO-uri
│   │   │   ├── ReactorMapper.php
│   │   │   ├── SensorMapper.php
│   │   │   ├── SensorConfigMapper.php
│   │   │   ├── AlertMapper.php
│   │   │   ├── UserMapper.php
│   │   │   ├── MeasurementMapper.php
│   │   │   └── ReactorMaintenanceMapper.php
│   │   │
│   │   ├── /Enums           # Enum-uri PHP
│   │   │   ├── UserRole.php         # admin, manager, viewer, technician
│   │   │   ├── SensorType.php       # Temperature, Pressure, Radiation, etc.
│   │   │   └── AlertSeverity.php    # warning, critical
│   │   │
│   │   ├── /Validators      # Validare parametri specifici tip reactor
│   │   │   ├── ReactorValidatorInterface.php
│   │   │   ├── CanduValidator.php
│   │   │   ├── PwrValidator.php
│   │   │   ├── SmrValidator.php
│   │   │   └── ValidatorFactory.php
│   │   │
│   │   ├── /Clients         # Integrări API externe
│   │   │   ├── ElevationApiClient.php
│   │   │   ├── MeteostatApiClient.php
│   │   │   └── SeismicApiClient.php
│   │   │
│   │   └── /Exceptions
│   │       └── ValidationException.php
│   │
│   ├── /config               # (Neutilizat - config prin .env)
│   ├── /data
│   │   └── worldcities.csv           # Date orașe pentru distanțe
│   └── composer.json                 # Autoload PSR-4 + dependențe
│
├── /init-db
│   └── schema.sql                    # Schema completă PostgreSQL
│
├── /scripts
│   └── simulator.py                  # Generator date senzori (Python)
│
├── docker-compose.yml               # web, frontend, composer, simulator
├── Dockerfile                        # php:8.2-apache
├── apache.conf                       # VirtualHost config
├── composer.json                     # Dependențe rădăcină
├── .env                             # Conexiune DB, JWT secret, API keys
├── .gitignore
└── Arhitecture.md                   # Acest document

---

## Fluxul unei cereri

```
Browser → Nginx (frontend:4000) → fișiere HTML/JS/CSS statice
       ↓ (fetch API)
       Apache (backend:8082) → index.php (Front Controller)
         → Router::dispatch()
           → Middleware (Auth/Admin/Sensor)
             → Controller
               → Service (business logic)
                 → Repository (SQL)
                   → Database (PostgreSQL/Neon)
```

## Fluxul de autentificare

```
1. POST /api/auth/login → AuthController::login
   → AuthService verifică parola
   → TokenService generează JWT access token (15min, HttpOnly cookie)
   → SessionService creează refresh token (30 zile, în DB + HttpOnly cookie)
   → Răspuns JSON cu date utilizator

2. La 401: frontendul face POST /api/auth/refresh (automat în authFetch)
   → TokenService decodează refresh token
   → SessionService reînnoiește sesiunea
   → Cookie-uri noi setate
```

## Stack tehnologic

| Componentă   | Tehnologie                          |
|--------------|-------------------------------------|
| Frontend     | HTML5, CSS3, JavaScript vanilla     |
| Hartă        | Leaflet.js + OpenStreetMap          |
| Backend      | PHP 8.2+ (vanilla, fără framework)  |
| Baza date    | PostgreSQL 16 (Neon cloud)          |
| Autentificare| JWT (firebase/php-jwt)              |
| Server web   | Apache 2.4 (backend), Nginx (frontend)|
| Containerizare| Docker + Docker Compose            |
| Simulator    | Python 3.11                         |
| Notificări   | Discord Webhooks                    |
| API Client   | fetch() vanilla cu retry logic      |

## Baza de date (8 tabele)

| Tabelă              | Rol                                |
|---------------------|------------------------------------|
| users               | Conturi utilizatori (4 roluri)     |
| refresh_tokens      | Tokeni de reîmprospătare sesiune   |
| reactors            | Reactoare nucleare (date tehnice + locație) |
| reactor_personnel   | Asignare tehnicieni la reactoare   |
| sensors             | Configurație senzori + valori      |
| sensor_readings     | Istoric măsurători (time-series)   |
| alerts              | Alerte (warning/critical)          |
| reactor_maintenance | Istoric mentenanță reactoare       |

## API Endpoints (40+)

- **Publice**: login, refresh, logout
- **Autentificate** (orice rol): reactoare, senzori, alerte, rapoarte, mentenanță
- **Admin**: CRUD utilizatori, reactoare, senzori, mentenanță
- **Simulator** (X-API-KEY): configurare senzori, înregistrare citiri

## Patterns

- **Arhitectură:** MVC custom cu layer de Service-Repository
- **DTO-uri pentru request/response:** separă datele externe de entități
- **Middleware chain:** rutare prin Auth → Admin (unde e cazul)
- **Validator per tip reactor:** CANDU, PWR, SMR au parametri diferiți
- **Polling:** alerte la 5s, hartă la 5s, simulator la 10s
