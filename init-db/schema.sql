-- 1. TABELA UTILIZATORI
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA SESIUNI (NOU)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA REACTOARE
CREATE TABLE IF NOT EXISTS reactors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_name VARCHAR(255),
    latitude DECIMAL(11, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'În construcție',
    installed_power FLOAT,
    current_efficiency FLOAT DEFAULT 0,
    soil_stability FLOAT,
    seismic_risk FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_maintenance TIMESTAMP,
    reactor_type VARCHAR(50),
    cooling_water_source VARCHAR(100), --rau lac mare ocean etc
    distance_to_nearest_city_km FLOAT,
    elevation_meters FLOAT
);

CREATE TABLE IF NOT EXISTS reactor_personnel (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reactor_id INTEGER REFERENCES reactors(id) ON DELETE CASCADE,
    intervention_role VARCHAR(100) NOT NULL
);

-- 4. TABELA SENZORI (ACTUALIZATĂ)
CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    reactor_id INTEGER REFERENCES reactors(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    min_safe_value FLOAT,
    max_safe_value FLOAT,
    current_value FLOAT DEFAULT 0,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA ISTORIC SENZORI (NOU)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
    recorded_value FLOAT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA ALERTE
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    reactor_id INTEGER REFERENCES reactors(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,              
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA MENTENANȚĂ
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,
    reactor_id INTEGER REFERENCES reactors(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
    scheduled_date DATE,
    completion_percent INTEGER DEFAULT 0,
    priority VARCHAR(20),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_date ON sensor_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_alerts_reactor_id ON alerts(reactor_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);