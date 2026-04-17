-- OmniESL Production Schema (PostgreSQL)

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'operator'
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    category TEXT,
    description TEXT,
    barcode TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Points (IoT Gateways)
CREATE TABLE access_points (
    id TEXT PRIMARY KEY, -- Hardware ID, e.g., 'AP-001'
    name TEXT,
    status TEXT DEFAULT 'OFFLINE', -- 'ONLINE', 'OFFLINE'
    ip_address TEXT,
    firmware_version TEXT,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESL Tags (E-Ink Devices)
CREATE TABLE tags (
    id TEXT PRIMARY KEY, -- Hardware ID, e.g., 'TAG-HEX-001'
    ap_id TEXT REFERENCES access_points(id),
    status TEXT DEFAULT 'READY', -- 'READY', 'UPDATING', 'ERROR'
    battery_level INTEGER, -- 0-100
    signal_strength INTEGER, -- RSSI in dBm
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bindings (Relationship between Tag and Product)
CREATE TABLE bindings (
    tag_id TEXT PRIMARY KEY REFERENCES tags(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    template_id TEXT, -- Future template support
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (Operations queue history)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'UPDATE_IMAGE', 'WAKEUP', 'WIPE'
    target_id TEXT NOT NULL, -- Hardware ID (usually tag)
    ap_id TEXT REFERENCES access_points(id),
    status TEXT NOT NULL DEFAULT 'PENDING', 
    -- States: PENDING, SENT, ACK, DISPLAYED, FAILED, TIMEOUT
    payload JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing Strategy
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_tags_ap_id ON tags(ap_id);
CREATE INDEX idx_tasks_target_id ON tasks(target_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_bindings_product_id ON bindings(product_id);
