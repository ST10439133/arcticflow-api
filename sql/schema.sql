CREATE TABLE IF NOT EXISTS users (
    uid             TEXT PRIMARY KEY,
    email           TEXT NOT NULL UNIQUE,
    display_name    TEXT,
    role            TEXT NOT NULL DEFAULT 'TECHNICIAN',
    phone_number    TEXT,
    created_at      BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS buildings (
    id              SERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    address         TEXT,
    suburb          TEXT,
    city            TEXT,
    province        TEXT,
    postal_code     TEXT,
    full_address    TEXT,
    unit_count      INT DEFAULT 1,
    floors          INT DEFAULT 1,
    building_type   TEXT DEFAULT 'RESIDENTIAL',
    registered_date BIGINT NOT NULL,
    status          TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS service_requests (
    id              SERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    building_id     INT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    building_name   TEXT,
    issue_type      TEXT,
    description     TEXT,
    priority        TEXT DEFAULT 'MEDIUM',
    preferred_date  BIGINT,
    status          TEXT DEFAULT 'PENDING',
    full_address    TEXT,
    created_at      BIGINT NOT NULL,
    updated_at      BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
    id              SERIAL PRIMARY KEY,
    request_id      INT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    technician_id   TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    customer_id     TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    building_name   TEXT,
    issue_type      TEXT,
    description     TEXT,
    scope_of_work   TEXT,
    parts_required  TEXT,
    estimated_hours NUMERIC DEFAULT 0,
    labor_cost      NUMERIC DEFAULT 0,
    parts_cost      NUMERIC DEFAULT 0,
    total_cost      NUMERIC DEFAULT 0,
    tax_amount      NUMERIC DEFAULT 0,
    grand_total     NUMERIC DEFAULT 0,
    status          TEXT DEFAULT 'PENDING',
    valid_until     BIGINT,
    created_at      BIGINT NOT NULL,
    updated_at      BIGINT NOT NULL,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS jobs (
    id                  SERIAL PRIMARY KEY,
    quote_id            INT,
    request_id          INT,
    technician_id       TEXT NOT NULL REFERENCES users(uid),
    customer_id         TEXT NOT NULL REFERENCES users(uid),
    building_name       TEXT,
    issue_type          TEXT,
    description         TEXT,
    status              TEXT DEFAULT 'PENDING',
    scheduled_date      BIGINT,
    start_date          BIGINT,
    completion_date     BIGINT,
    notes               TEXT,
    rating              REAL,
    review              TEXT,
    technician_on_way   BOOLEAN DEFAULT FALSE,
    full_address        TEXT,
    created_at          BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS tech_locations (
    technician_id   TEXT PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    technician_name TEXT,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    job_id          INT,
    customer_id     TEXT,
    building_name   TEXT,
    is_on_my_way    BOOLEAN DEFAULT FALSE,
    last_updated    BIGINT NOT NULL,
    status          TEXT DEFAULT 'idle'
);

CREATE INDEX IF NOT EXISTS idx_requests_user      ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status    ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotes_technician  ON quotes(technician_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer    ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer      ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_technician    ON jobs(technician_id);
CREATE INDEX IF NOT EXISTS idx_locations_on_way   ON tech_locations(is_on_my_way);