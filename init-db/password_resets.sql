CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
