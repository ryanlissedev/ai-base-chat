-- Test User table specific functionality
BEGIN;

SELECT plan(12);

-- Test User table primary key
SELECT has_pk('public', 'User', 'User table should have primary key');
SELECT col_is_pk('public', 'User', 'id', 'User.id should be primary key');

-- Test User table column types and constraints
SELECT col_type_is('public', 'User', 'id', 'uuid', 'User.id should be uuid');
SELECT col_type_is('public', 'User', 'createdAt', 'timestamp without time zone', 'User.createdAt should be timestamp');
SELECT col_type_is('public', 'User', 'email', 'character varying(255)', 'User.email should be varchar(255)');
SELECT col_type_is('public', 'User', 'name', 'character varying(100)', 'User.name should be varchar(100)');
SELECT col_type_is('public', 'User', 'image', 'character varying(500)', 'User.image should be varchar(500)');
SELECT col_type_is('public', 'User', 'credits', 'integer', 'User.credits should be integer');
SELECT col_type_is('public', 'User', 'reservedCredits', 'integer', 'User.reservedCredits should be integer');

-- Test User table defaults
SELECT col_default_is('public', 'User', 'credits', '100', 'User.credits should default to 100');
SELECT col_default_is('public', 'User', 'reservedCredits', '0', 'User.reservedCredits should default to 0');

-- Test User table indexes
SELECT has_index('public', 'User', 'user_email_idx', 'User should have email index');

SELECT * FROM finish();
ROLLBACK;