-- OmniESL Enterprise Schema [Phase 1]
-- Focus: Referential Integrity, Indexing, and Auditing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. AUTHENTICATION & ACCESS CONTROL
CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY -- 'ADMIN', 'MANAGER', 'OPERATOR'
);

INSERT INTO roles (name) VALUES ('ADMIN'), ('MANAGER'), ('OPERATOR') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_name TEXT REFERENCES roles(name) DEFAULT 'OPERATOR',
    full_name TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCT MASTER DATA
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    category TEXT,
    barcode TEXT,
    last_modified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INFRASTRUCTURE (Access Points)
CREATE TABLE IF NOT EXISTS access_points (
    id TEXT PRIMARY KEY, -- Hardware Serial
    alias TEXT,
    ip_address INET,
    firmware_version TEXT,
    status TEXT CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE')) DEFAULT 'OFFLINE',
    site_location TEXT, -- Store zone
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HARDWARE (ESL Tags)
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY, -- Hardware Serial
    type TEXT DEFAULT 'BW_296_128', -- Screen specs
    current_ap_id TEXT REFERENCES access_points(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('READY', 'UPDATING', 'ERROR', 'OFFLINE')) DEFAULT 'READY',
    battery_level SMALLINT CHECK (battery_level BETWEEN 0 AND 100),
    rssi SMALLINT, -- Signal strength dBm
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BINDINGS & TEMPLATES
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    layout_json JSONB NOT NULL, -- Config for renderer
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bindings (
    tag_id TEXT PRIMARY KEY REFERENCES tags(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    template_id TEXT REFERENCES templates(id) DEFAULT 'default',
    last_rendered_price DECIMAL(10, 2),
    is_dirty BOOLEAN DEFAULT FALSE, -- Flag if image needs re-render
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ASYNCHRONOUS TASKS (The Payload Queue)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'IMAGE_UPDATE', 'WAKEUP', 'REBOOT'
    target_tag_id TEXT NOT NULL REFERENCES tags(id),
    ap_id TEXT NOT NULL REFERENCES access_points(id),
    status TEXT CHECK (status IN ('PENDING', 'SENT', 'ACK', 'DISPLAYED', 'FAILED', 'TIMEOUT')) DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    payload_size INT, -- Diagnostic
    error_message TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TELEMETRY & AUDIT (Historical)
CREATE TABLE IF NOT EXISTS tag_telemetry_history (
    id BIGSERIAL PRIMARY KEY,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    battery_level SMALLINT,
    rssi SMALLINT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL, -- 'PRICE_CHANGE', 'TAG_BIND', 'SYSTEM_RESET'
    entity_type TEXT, -- 'PRODUCT', 'TAG'
    entity_id TEXT,
    old_value JSONB,
    new_value JSONB,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE INDEXES
CREATE INDEX idx_tag_last_seen ON tags(last_seen);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_telemetry_time ON tag_telemetry_history(recorded_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
