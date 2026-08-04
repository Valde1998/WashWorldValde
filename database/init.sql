CREATE DATABASE IF NOT EXISTS cleanwash;
USE cleanwash;

DROP TABLE IF EXISTS password_reset_tokens;
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
    image VARCHAR(120) NOT NULL
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

INSERT INTO locations (name, city, address, opening_hours, queue_minutes, image) VALUES
('WashWorld Tilst', 'Tilst', 'Blomstervej 12', '06:00 - 22:00', 4, '/location-tilst.webp'),
('WashWorld Viby', 'Viby', 'Sonderhoj 9', '06:00 - 22:00', 7, '/location-viby.webp'),
('WashWorld Hojbjerg', 'Hojbjerg', 'Oddervej 88', '07:00 - 21:00', 2, '/location-hojbjerg.webp');

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
