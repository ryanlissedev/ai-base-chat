-- pgTAP schema tests
-- Test database schema structure, constraints, and relationships

BEGIN;
SELECT plan(20); -- Number of tests we plan to run

-- Test that required extensions are installed
SELECT has_extension('uuid-ossp', 'UUID extension should be installed');

-- Test that required schemas exist
SELECT has_schema('public', 'Public schema should exist');

-- Test User table structure
SELECT has_table('public', 'User', 'User table should exist');
SELECT has_column('public', 'User', 'id', 'User.id column should exist');
SELECT has_column('public', 'User', 'email', 'User.email column should exist');
SELECT has_column('public', 'User', 'credits', 'User.credits column should exist');
SELECT col_type_is('public', 'User', 'id', 'text', 'User.id should be text type');
SELECT col_has_default('public', 'User', 'credits', 'User.credits should have a default value');

-- Test Chat table structure
SELECT has_table('public', 'Chat', 'Chat table should exist');
SELECT has_column('public', 'Chat', 'id', 'Chat.id column should exist');
SELECT has_column('public', 'Chat', 'userId', 'Chat.userId column should exist');
SELECT has_column('public', 'Chat', 'visibility', 'Chat.visibility column should exist');

-- Test Message table structure
SELECT has_table('public', 'Message', 'Message table should exist');
SELECT has_column('public', 'Message', 'chatId', 'Message.chatId column should exist');
SELECT has_column('public', 'Message', 'parentMessageId', 'Message.parentMessageId column should exist');

-- Test foreign key constraints
SELECT has_fk('public', 'Chat', 'Chat.userId should have FK constraint');
SELECT has_fk('public', 'Message', 'Message.chatId should have FK constraint');

-- Test indexes
SELECT has_index('public', 'User', 'user_email_idx', 'email', 'User table should have email index');
SELECT has_index('public', 'Chat', 'chat_user_id_idx', 'userId', 'Chat table should have userId index');

-- Test constraints
SELECT col_not_null('public', 'User', 'email', 'User.email should be NOT NULL');

SELECT * FROM finish();
ROLLBACK;