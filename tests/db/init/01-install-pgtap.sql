-- Install pgTAP extension
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Create a function to check if pgTAP is installed
CREATE OR REPLACE FUNCTION check_pgtap_installed()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pgtap'
    );
END;
$$ LANGUAGE plpgsql;

-- Verify pgTAP is installed
SELECT check_pgtap_installed() as pgtap_installed;