# Linii comentate pentru a dezactiva autentificarea

## `frontend/public/assets/js/api.js`
- **Linia 23**: `window.location.href = 'login.html';` — redirect la 401 (token expirat)

## `frontend/public/assets/js/auth.js`
- **Linia 43**: `window.location.href = 'login.html';` — redirect după înregistrare reușită
- **Linia 82**: `window.location.href = 'login.html';` — redirect după resetare parolă

## `backend/public/index.php`
- **Linia 19**: `use App\Middleware\AdminMiddleware;` — import middleware admin
- **Linia 20**: `use App\Middleware\AuthMiddleware;` — import middleware auth
- **Linia 50**: `[AdminMiddleware::class]` — protecție ruta register
- **Linia 51**: `[AdminMiddleware::class]` — protecție ruta update password
- **Linia 54**: `[AdminMiddleware::class]` — protecție ruta add reactor
- **Linia 55**: `[AdminMiddleware::class]` — protecție ruta update reactor
- **Linia 56**: `[AdminMiddleware::class]` — protecție ruta delete reactor
- **Linia 59**: `[AdminMiddleware::class]` — protecție ruta add sensor
- **Linia 60**: `[AdminMiddleware::class]` — protecție ruta update sensor
- **Linia 61**: `[AdminMiddleware::class]` — protecție ruta delete sensor
- **Linia 70**: `[AuthMiddleware::class]` — protecție ruta get reactors
- **Linia 71**: `[AuthMiddleware::class]` — protecție ruta get reactor by id
- **Linia 74**: `[AuthMiddleware::class]` — protecție ruta get sensors
- **Linia 75**: `[AuthMiddleware::class]` — protecție ruta get sensor by id
- **Linia 78**: `[AuthMiddleware::class]` — protecție ruta record sensor value
