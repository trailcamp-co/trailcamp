-- Migration: Add usage statistics tracking
-- Created: 2026-02-28

CREATE TABLE IF NOT EXISTS usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    query_params TEXT,
    response_time_ms INTEGER,
    status_code INTEGER,
    user_agent TEXT,
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON usage_stats(endpoint);
CREATE INDEX IF NOT EXISTS idx_usage_status ON usage_stats(status_code);
