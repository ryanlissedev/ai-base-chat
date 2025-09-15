-- Test Message table specific functionality
BEGIN;

SELECT plan(18);

-- Test Message table primary key
SELECT has_pk('public', 'Message', 'Message table should have primary key');
SELECT col_is_pk('public', 'Message', 'id', 'Message.id should be primary key');

-- Test Message table column types
SELECT col_type_is('public', 'Message', 'id', 'uuid', 'Message.id should be uuid');
SELECT col_type_is('public', 'Message', 'chatId', 'uuid', 'Message.chatId should be uuid');
SELECT col_type_is('public', 'Message', 'parentMessageId', 'uuid', 'Message.parentMessageId should be uuid');
SELECT col_type_is('public', 'Message', 'role', 'character varying', 'Message.role should be varchar');
SELECT col_type_is('public', 'Message', 'parts', 'json', 'Message.parts should be json');
SELECT col_type_is('public', 'Message', 'attachments', 'json', 'Message.attachments should be json');
SELECT col_type_is('public', 'Message', 'createdAt', 'timestamp without time zone', 'Message.createdAt should be timestamp');
SELECT col_type_is('public', 'Message', 'annotations', 'json', 'Message.annotations should be json');
SELECT col_type_is('public', 'Message', 'isPartial', 'boolean', 'Message.isPartial should be boolean');
SELECT col_type_is('public', 'Message', 'selectedModel', 'character varying(256)', 'Message.selectedModel should be varchar(256)');
SELECT col_type_is('public', 'Message', 'selectedTool', 'character varying(256)', 'Message.selectedTool should be varchar(256)');
SELECT col_type_is('public', 'Message', 'lastContext', 'json', 'Message.lastContext should be json');

-- Test Message table defaults
SELECT col_default_is('public', 'Message', 'isPartial', 'false', 'Message.isPartial should default to false');
SELECT col_default_is('public', 'Message', 'selectedModel', '''''''::character varying', 'Message.selectedModel should default to empty string');
SELECT col_default_is('public', 'Message', 'selectedTool', '''''''::character varying', 'Message.selectedTool should default to empty string');

-- Test Message table foreign keys
SELECT fk_ok('public', 'Message', 'chatId', 'public', 'Chat', 'id', 'Message.chatId should reference Chat.id');

SELECT * FROM finish();
ROLLBACK;