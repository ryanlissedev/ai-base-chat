-- Test Chat table specific functionality
BEGIN;

SELECT plan(15);

-- Test Chat table primary key
SELECT has_pk('public', 'Chat', 'Chat table should have primary key');
SELECT col_is_pk('public', 'Chat', 'id', 'Chat.id should be primary key');

-- Test Chat table column types
SELECT col_type_is('public', 'Chat', 'id', 'uuid', 'Chat.id should be uuid');
SELECT col_type_is('public', 'Chat', 'createdAt', 'timestamp without time zone', 'Chat.createdAt should be timestamp');
SELECT col_type_is('public', 'Chat', 'updatedAt', 'timestamp without time zone', 'Chat.updatedAt should be timestamp');
SELECT col_type_is('public', 'Chat', 'title', 'text', 'Chat.title should be text');
SELECT col_type_is('public', 'Chat', 'userId', 'uuid', 'Chat.userId should be uuid');
SELECT col_type_is('public', 'Chat', 'visibility', 'character varying', 'Chat.visibility should be varchar');
SELECT col_type_is('public', 'Chat', 'isPinned', 'boolean', 'Chat.isPinned should be boolean');

-- Test Chat table defaults
SELECT col_default_is('public', 'Chat', 'visibility', '''private''::character varying', 'Chat.visibility should default to private');
SELECT col_default_is('public', 'Chat', 'isPinned', 'false', 'Chat.isPinned should default to false');

-- Test Chat table foreign keys
SELECT fk_ok('public', 'Chat', 'userId', 'public', 'User', 'id', 'Chat.userId should reference User.id');

-- Test Chat table indexes
SELECT has_index('public', 'Chat', 'chat_user_id_idx', 'Chat should have userId index');
SELECT has_index('public', 'Chat', 'chat_updated_at_idx', 'Chat should have updatedAt index');
SELECT has_index('public', 'Chat', 'chat_visibility_idx', 'Chat should have visibility index');

SELECT * FROM finish();
ROLLBACK;