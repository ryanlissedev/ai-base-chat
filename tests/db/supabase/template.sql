-- Supabase-style template database setup for test isolation
-- This creates a template database that can be quickly cloned for each test

-- Create template database if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'test_template'
  ) THEN
    PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE test_template WITH TEMPLATE template0');
  END IF;
END
$$;

-- Connect to template database and set up base structure
\c test_template

-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgtap";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema version tracking table
CREATE TABLE IF NOT EXISTS schema_version (
  version_id SERIAL PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  installed_by VARCHAR(100) DEFAULT CURRENT_USER,
  execution_time INTEGER,
  checksum VARCHAR(64)
);

-- Insert initial schema version
INSERT INTO schema_version (version, description, checksum)
VALUES ('1.0.0', 'Initial schema version', md5('initial_schema')::varchar)
ON CONFLICT (version) DO NOTHING;

-- Create test helper functions following Supabase patterns

-- Function to create a test database from template
CREATE OR REPLACE FUNCTION create_test_db(test_name TEXT)
RETURNS TEXT AS $$
DECLARE
  db_name TEXT;
BEGIN
  db_name := 'test_' || test_name || '_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
  EXECUTE format('CREATE DATABASE %I WITH TEMPLATE test_template', db_name);
  RETURN db_name;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up test databases
CREATE OR REPLACE FUNCTION cleanup_test_dbs(older_than INTERVAL DEFAULT '1 hour')
RETURNS INTEGER AS $$
DECLARE
  db_count INTEGER := 0;
  db_name TEXT;
BEGIN
  FOR db_name IN
    SELECT datname FROM pg_database
    WHERE datname LIKE 'test_%'
    AND (NOW() - pg_stat_file('base/' || oid || '/PG_VERSION')::timestamp) > older_than
  LOOP
    EXECUTE format('DROP DATABASE IF EXISTS %I', db_name);
    db_count := db_count + 1;
  END LOOP;
  RETURN db_count;
END;
$$ LANGUAGE plpgsql;

-- Function to verify schema version
CREATE OR REPLACE FUNCTION verify_schema_version(expected_version TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_version TEXT;
BEGIN
  SELECT version INTO current_version
  FROM schema_version
  ORDER BY installed_on DESC
  LIMIT 1;

  RETURN current_version = expected_version;
END;
$$ LANGUAGE plpgsql;

-- Function to snapshot current database state
CREATE OR REPLACE FUNCTION create_db_snapshot(snapshot_name TEXT)
RETURNS JSON AS $$
DECLARE
  snapshot_data JSON;
BEGIN
  WITH table_counts AS (
    SELECT
      table_name,
      (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = tc.table_name) as row_count
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
  )
  SELECT json_object_agg(table_name, row_count) INTO snapshot_data
  FROM table_counts;

  -- Store snapshot metadata
  INSERT INTO test_snapshots (name, data, created_at)
  VALUES (snapshot_name, snapshot_data, NOW());

  RETURN snapshot_data;
END;
$$ LANGUAGE plpgsql;

-- Create table for test snapshots
CREATE TABLE IF NOT EXISTS test_snapshots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS test_performance (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(255) NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  memory_usage_kb INTEGER,
  queries_executed INTEGER,
  test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  test_status VARCHAR(20) NOT NULL,
  error_message TEXT
);

-- Function to record test performance
CREATE OR REPLACE FUNCTION record_test_performance(
  p_test_name TEXT,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP,
  p_status TEXT DEFAULT 'success',
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO test_performance (
    test_name,
    execution_time_ms,
    test_status,
    error_message
  ) VALUES (
    p_test_name,
    EXTRACT(MILLISECONDS FROM (p_end_time - p_start_time))::INTEGER,
    p_status,
    p_error
  );
END;
$$ LANGUAGE plpgsql;

-- Mark template as ready
UPDATE schema_version
SET description = description || ' - Template ready for cloning'
WHERE version = '1.0.0';