-- GoTogether Database Initialization Script
-- This script sets up the database with PostGIS extension for geospatial operations

-- Enable PostGIS extension (optional, for advanced geospatial operations)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Create database user if not exists (handled by Docker environment)
-- This is just for reference

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (will be created by Alembic migrations)
-- These are just for reference

-- Sample data for development (optional)
-- INSERT INTO users (id, phone, name, is_verified, rating, total_trips, created_at) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', '+919876543210', 'John Doe', true, 4.5, 10, NOW()),
-- ('550e8400-e29b-41d4-a716-446655440001', '+919876543211', 'Jane Smith', true, 4.8, 15, NOW());

-- Performance optimization settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Reload configuration
SELECT pg_reload_conf();
