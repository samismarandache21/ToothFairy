-- ============================================================
-- ToothFairy — Schema PostgreSQL
-- Rulează manual sau păstrează ca referință.
-- Aplicația folosește ddl-auto=update (Hibernate creează/alterează
-- tabelele automat la pornire).
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- pentru gen_random_uuid()

-- ── Drop (pentru recreare completă în dev) ───────────────────────────────────
-- DROP TABLE IF EXISTS sms_log, appointments, treatment_types, patients, cabinets CASCADE;

-- ── cabinets ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cabinets (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name   VARCHAR(100),
    last_name    VARCHAR(100),
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    password     VARCHAR(255) NOT NULL,
    phone        VARCHAR(20),
    address      TEXT,
    city         VARCHAR(100),
    description  TEXT,
    slug         VARCHAR(255),
    website      VARCHAR(255),
    specialties  TEXT,                          -- JSON array: ["Implantologie","Estetică"]
    languages    TEXT,                          -- JSON array: ["Română","Engleză"]
    sms_credits  INTEGER      DEFAULT 50,
    plan         VARCHAR(20)  DEFAULT 'starter',
    rating       DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER      DEFAULT 0,
    created_at   TIMESTAMP    DEFAULT NOW(),
    updated_at   TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cabinets_email ON cabinets(email);
CREATE INDEX IF NOT EXISTS idx_cabinets_slug  ON cabinets(slug);

-- ── patients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id    UUID        NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20)  NOT NULL,
    email         VARCHAR(255),
    birth_date    DATE,
    medical_notes TEXT,
    allergies     TEXT,
    created_at    TIMESTAMP   DEFAULT NOW(),
    UNIQUE(cabinet_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_patients_cabinet  ON patients(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone    ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name     ON patients(last_name, first_name);

-- ── treatment_types ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatment_types (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id       UUID         NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    duration_minutes INTEGER      DEFAULT 30,
    price            DECIMAL(10,2),
    color            VARCHAR(7)   DEFAULT '#2DD4BF'
);

CREATE INDEX IF NOT EXISTS idx_treatment_types_cabinet ON treatment_types(cabinet_id);

-- ── appointments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id        UUID        NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    patient_id        UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_type_id UUID        REFERENCES treatment_types(id) ON DELETE SET NULL,
    start_time        TIMESTAMP   NOT NULL,
    end_time          TIMESTAMP   NOT NULL,
    status            VARCHAR(20) DEFAULT 'confirmed',  -- confirmed | pending | cancelled | completed | no_show
    notes             TEXT,
    sms_sent          BOOLEAN     DEFAULT FALSE,
    sms_sent_at       TIMESTAMP,
    created_at        TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_cabinet     ON appointments(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient     ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time  ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status      ON appointments(status);

-- ── patient_accounts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_accounts (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email      VARCHAR(255) UNIQUE NOT NULL,
    phone      VARCHAR(20)  NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_accounts_email ON patient_accounts(email);
CREATE INDEX IF NOT EXISTS idx_patient_accounts_phone ON patient_accounts(phone);

-- ── reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id  UUID     NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    author_name VARCHAR(200),
    rating      INTEGER  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text        TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_cabinet ON reviews(cabinet_id);

-- ── sms_log ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_log (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID        REFERENCES appointments(id) ON DELETE SET NULL,
    phone          VARCHAR(20),
    message        TEXT,
    status         VARCHAR(20) DEFAULT 'sent',
    sent_at        TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_log_appointment ON sms_log(appointment_id);

-- ── clinic_accounts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinic_accounts (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    address     TEXT,
    city        VARCHAR(100),
    description TEXT,
    created_at  TIMESTAMP    DEFAULT NOW(),
    updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_accounts_email ON clinic_accounts(email);

-- ── dentist_join_requests ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dentist_join_requests (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id         UUID        NOT NULL,
    clinic_account_id  UUID        NOT NULL REFERENCES clinic_accounts(id) ON DELETE CASCADE,
    status             VARCHAR(20) DEFAULT 'PENDING',
    message            TEXT,
    requested_at       TIMESTAMP   DEFAULT NOW(),
    resolved_at        TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_join_requests_clinic  ON dentist_join_requests(clinic_account_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_cabinet ON dentist_join_requests(cabinet_id);

-- ── Trigger: updated_at auto-update ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cabinets_updated_at ON cabinets;
CREATE TRIGGER update_cabinets_updated_at
    BEFORE UPDATE ON cabinets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
