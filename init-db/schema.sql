CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Parola criptată generată de PHP
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',   -- Roluri acceptate: 'admin', 'technician', 'viewer'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reactors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_name VARCHAR(255),
    latitude DECIMAL(11, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'Activ', -- Status: Activ, Mentenanță, Alertă, Oprit
    installed_power FLOAT,              -- Puterea instalată în MW
    current_efficiency FLOAT DEFAULT 0, -- Eficiența curentă în %
    soil_stability FLOAT,               -- Scor stabilitate (1-100)
    seismic_risk FLOAT,                 -- Scor risc (1-100)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_maintenance TIMESTAMP
);

CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    reactor_id INTEGER REFERENCES reactors(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL,   -- Tip: Temperatura, Presiune_Apa, Radiatii
    current_value FLOAT NOT NULL,
    unit VARCHAR(20),                   -- Unitate: °C, bar, mSv/h
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    reactor_id INTEGER REFERENCES reactors(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,      -- Gravitate: Critica, Avertisment, Info
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,              -- Data/Ora rezolvării
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Cine a rezolvat alerta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    reactor_id INTEGER REFERENCES reactors(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Tehnicianul alocat
    scheduled_date DATE,
    completion_percent INTEGER DEFAULT 0,
    priority VARCHAR(20),               -- Prioritate: Urgenta, Planificata, Rutina
    resolved_at TIMESTAMP
);