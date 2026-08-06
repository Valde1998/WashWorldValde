CREATE DATABASE IF NOT EXISTS cleanwash;
USE cleanwash;

DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS email_outbox;
DROP TABLE IF EXISTS wash_history;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    city VARCHAR(80) NOT NULL,
    address VARCHAR(120) NOT NULL,
    opening_hours VARCHAR(80) NOT NULL,
    queue_minutes INT NOT NULL,
    image VARCHAR(120) NOT NULL,
    slug VARCHAR(180),
    postal_code VARCHAR(10),
    latitude DECIMAL(11, 8),
    longitude DECIMAL(11, 8),
    location_type VARCHAR(20) NOT NULL DEFAULT 'washhall',
    halls_count INT NOT NULL DEFAULT 1,
    self_wash_count INT NOT NULL DEFAULT 0,
    source_url VARCHAR(255),
    source_checked_on DATE
);

CREATE TABLE plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(255) NOT NULL,
    monthly_price DECIMAL(8, 2) NOT NULL,
    single_wash_price DECIMAL(8, 2) NOT NULL
);

CREATE TABLE users (
    user_id CHAR(32) PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    phone VARCHAR(30),
    location_id INT NOT NULL,
    plan_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id),
    FOREIGN KEY (plan_id) REFERENCES plans(plan_id)
);

CREATE TABLE wash_history (
    wash_id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL,
    location_id INT NOT NULL,
    wash_type VARCHAR(80) NOT NULL,
    washed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

CREATE TABLE email_outbox (
    email_id CHAR(32) PRIMARY KEY,
    user_id CHAR(32),
    email_to VARCHAR(120) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE password_reset_tokens (
    reset_id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL,
    reset_key CHAR(32) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE email_verification_tokens (
    verification_id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL UNIQUE,
    code_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    last_sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

INSERT INTO locations (
    name, city, address, opening_hours, queue_minutes, image, slug, postal_code,
    latitude, longitude, location_type, halls_count, self_wash_count, source_url, source_checked_on
) VALUES
('Tilst - Blomstervej', 'Tilst', 'Blomstervej 2T, 8381 Tilst', '7-22', 0, '/location-tilst.webp', 'tilst-blomstervej', '8381', 56.181787, 10.125, 'washhall', 2, 0, 'https://washworld.dk/find-wash-world-vaskehal/tilst-blomstervej', '2026-08-05'),
('Viby - Gunnar Clausens vej', 'Viby', 'Gunnar Clausens Vej 2A, 8260 Viby', '7-22', 0, '/location-viby.webp', 'viby-gunnar-clausens-vej', '8260', 56.111373, 10.125033, 'both', 2, 1, 'https://washworld.dk/find-wash-world-vaskehal/viby-gunnar-clausens-vej', '2026-08-05'),
('Højbjerg - Bjødstrupvej', 'Højbjerg', 'Bjødstrupvej 20E, 8270 Højbjerg', '7-22', 0, '/location-hojbjerg.webp', 'hojbjerg-bjodstrupvej', '8270', 56.107525, 10.166967, 'washhall', 2, 0, 'https://washworld.dk/find-wash-world-vaskehal/hojbjerg-bjodstrupvej', '2026-08-05');

INSERT INTO plans (name, description, monthly_price, single_wash_price) VALUES
('Basis', 'Til dig der vasker bilen et par gange om maaneden.', 99.00, 79.00),
('Plus', 'Den mest brugte pakke med fri vask i din faste vaskehal.', 149.00, 99.00),
('Premium', 'Fri vask i alle vaskehaller og ekstra lakbeskyttelse.', 199.00, 129.00);

INSERT INTO users (
    user_id,
    first_name,
    email,
    password_hash,
    license_plate,
    phone,
    location_id,
    plan_id
) VALUES (
    '11111111111111111111111111111111',
    'Demo',
    'demo@washworld.dk',
    'pbkdf2:sha256:1000000$cleansalt$205e7ac25787fd22f31f09e5b63c0193d19db153911f9a4e0a755ed3a2ebc025',
    'AB 12345',
    '12345678',
    1,
    2
);

INSERT INTO wash_history (wash_id, user_id, location_id, wash_type, washed_at) VALUES
('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '11111111111111111111111111111111', 1, 'Plus vask', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', '11111111111111111111111111111111', 2, 'Plus vask', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('cccccccccccccccccccccccccccccccc', '11111111111111111111111111111111', 1, 'Plus vask', DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO email_outbox (email_id, user_id, email_to, subject, body) VALUES
('dddddddddddddddddddddddddddddddd', '11111111111111111111111111111111', 'demo@washworld.dk', 'Velkommen til WashWorld', 'Hej Demo. Din demo-bruger er klar.');
