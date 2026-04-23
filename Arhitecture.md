# Arhitectura Proiectului - NuclearWatch (Vanilla PHP & JS)

/proiect-centrala-nucleara
│
├── /frontend               # Tot ce ține de Interfața Utilizator (Client)
│   ├── /public             # Fișierele HTML accesibile direct
│   │   ├── index.html            # Dashboard (status general)
│   │   ├── reactors.html         # Management amplasare și detalii reactoare
│   │   ├── stats.html            # Vizualizări și rapoarte
│   │   ├── alerts.html           # Istoric alerte și mentenanță
│   │   ├── login.html            # [AUTH] Formular de logare
│   │   ├── register.html         # [AUTH] Formular creare cont (Viewer/Tech)
│   │   ├── forgetpassword.html   # [AUTH] Formular recuperare parolă
│   │   └── feed.xml              # (Opțional) Fișier pentru RSS
│   │
│   └── /assets             # Resurse statice (Atașate de /public)
│       ├── /css
│       │   └── style.css         # Stiluri globale UI
│       ├── /js
│       │   ├── auth.js           # [AUTH] Logica de login, salvare Token/Sesiune
│       │   ├── api.js            # Clasă/funcții pentru apelurile fetch() către backend (atașează token automat)
│       │   ├── polling.js        # Logica de AJAX Polling pentru real-time (senzori)
│       │   ├── charts.js         # Logica pentru vizualizări (Chart.js)
│       │   └── app.js            # Logica generală a interfeței (meniuri, tab-uri)
│       └── /img                  # Imagini, iconițe, hărți
│
├── /backend                # API-ul în PHP Vanilla (Server)
│   ├── /config             
│   │   ├── database.php          # Setările de conectare la PostgreSQL
│   │   └── config.php            # Alte constante (chei API, setări JWT/Sesiuni)
│   │
│   ├── /src                # Codul sursă principal
│   │   ├── /Controllers    # Preiau datele din frontend și returnează JSON
│   │   │   ├── AuthController.php      # [AUTH] Preia Logare/Înregistrare
│   │   │   ├── PasswordController.php  # [AUTH] Gestionează Resetare parolă
│   │   │   ├── AlertController.php
│   │   │   ├── MonitorController.php
│   │   │   ├── ReactorController.php
│   │   │   └── ReportController.php
│   │   │
│   │   ├── /Services       # Creierul aplicației (Business Logic & calcule)
│   │   │   ├── AuthService.php         # [AUTH] Criptare parole, validare JWT
│   │   │   ├── MailService.php         # [AUTH] Trimite email cu PHPMailer pt Resetare
│   │   │   ├── AlertService.php
│   │   │   ├── AnalyticsService.php
│   │   │   └── ReactorService.php
│   │   │
│   │   ├── /Repositories   # Singurele fișiere care știu SQL (Relația cu baza de date)
│   │   │   ├── UserRepository.php      # [AUTH] SELECT/INSERT în tabelul `users`
│   │   │   ├── AlertRepository.php
│   │   │   ├── ReactorRepository.php
│   │   │   └── SensorRepository.php
│   │   │
│   │   ├── /Models         # Modelele de date (Clase care reprezintă un rând din tabel)
│   │   │   ├── User.php                # [AUTH]
│   │   │   ├── Alert.php
│   │   │   ├── Reactor.php
│   │   │   └── Sensor.php
│   │   │
│   │   └── /Core           # Infrastructura framework-ului tău custom
│   │       ├── Router.php              # Dirijează link-urile către Controllere
│   │       ├── Database.php            # Conexiunea PDO Singleton
│   │       ├── Response.php            # Helper pentru returnat JSON curat
│   │       └── Middleware.php          # [AUTH] Paznicul: verifică rolurile și permisiunile
│   │
│   ├── /public             # Document Root-ul pentru serverul de backend
│   │   ├── index.php             # Front Controller (TOATE cererile intră pe aici)
│   │   └── .htaccess             # Rescriere URL (dacă folosim Apache în viitor)
│   │
│   ├── .env                # Fișier ascuns cu parole (PostgreSQL, Mailtrap)
│   └── composer.json       # Autoloader PSR-4 și dependențe (PHPMailer, Dotenv)
│
├── .gitignore              # Ignoră .env, /vendor, etc.
└── Arhitecture.md          # Acest document