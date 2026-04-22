/proiect-centrala-nucleara
│
├── /frontend                   # Tot ce ține de Interfața Utilizator
│   ├── /public                 # Fișierele HTML accesibile direct
│   │   ├── index.html          # Dashboard (status general)
│   │   ├── reactors.html       # Management amplasare și detalii reactoare
│   │   ├── stats.html          # Vizualizări și rapoarte
│   │   └── alerts.html         # Istoric alerte și mentenanță
│   │
│   ├── /assets
│   │   ├── /css
│   │   │   └── style.css       # Stiluri globale
│   │   ├── /js
│   │   │   ├── api.js          # Clasă/funcții pentru apelurile fetch() către backend API
│   │   │   ├── polling.js      # Logica de AJAX Polling pentru real-time
│   │   │   ├── charts.js       # Logica pentru vizualizări (ex. folosind Chart.js)
│   │   │   └── app.js          # Logica generală a interfeței
│   │   └── /img                # Imagini, iconițe, hărți
│   │
│   └── feed.xml                # (Opțional) Un fișier static sau generat dinamic pentru RSS
│
└── /backend                    # API-ul în PHP Vanilla
    ├── /config
    │   ├── database.php        # Setările de conectare la PostgreSQL
    │   └── config.php          # Alte constante (chei API, setări SMTP)
    │
    ├── /src                    # Codul sursă principal
    │   ├── /Controllers        # Gestionează request-urile HTTP
    │   │   ├── AlertController.php
    │   │   ├── MonitorController.php
    │   │   ├── ReactorController.php
    │   │   ├── ReportController.php
    │   │   └── RssController.php
    │   │
    │   ├── /Services           # Logica de business (Business Logic)
    │   │   ├── AlertService.php
    │   │   ├── AnalyticsService.php
    │   │   ├── MonitorService.php
    │   │   └── ReactorService.php
    │   │
    │   ├── /Repositories       # Interacțiunea cu baza de date (PDO)
    │   │   ├── AlertRepository.php
    │   │   ├── ReactorRepository.php
    │   │   └── SensorRepository.php
    │   │
    │   ├── /Models             # Modelele de domeniu (DDD Entities)
    │   │   ├── Alert.php
    │   │   ├── Reactor.php
    │   │   └── Sensor.php
    │   │
    │   └── /Core               # Componente de bază ale framework-ului tău custom
    │       ├── Router.php      # Rutează cererile către controllere
    │       ├── Database.php    # Clasa de tip Singleton/Factory pentru conexiunea PDO
    │       └── Response.php    # Funcții helper pentru a returna JSON curat
    │
    ├── /public                 # Document Root-ul pentru serverul de backend
    │   ├── index.php           # Front Controller-ul (toate request-urile trec pe aici)
    │   └── .htaccess           # Rescrie URL-urile către index.php (dacă folosești Apache)
    │
    └── composer.json           # (Recomandat) Chiar dacă e vanilla, e util pentru Autoloading PSR-4 și PHPMailer