-- Test constraints and data types
BEGIN;

SELECT plan(25);

-- Test User table constraints and types
SELECT col_type_is('public', 'User', 'id', 'uuid', 'User.id should be uuid');
SELECT col_not_null('public', 'User', 'id', 'User.id should be NOT NULL');
SELECT col_not_null('public', 'User', 'createdAt', 'User.createdAt should be NOT NULL');
SELECT col_not_null('public', 'User', 'email', 'User.email should be NOT NULL');
SELECT col_type_is('public', 'User', 'email', 'character varying(255)', 'User.email should be varchar(255)');
SELECT col_type_is('public', 'User', 'name', 'character varying(100)', 'User.name should be varchar(100)');
SELECT col_type_is('public', 'User', 'credits', 'integer', 'User.credits should be integer');
SELECT col_has_default('public', 'User', 'credits', 'User.credits should have default value');

-- Test Chat table constraints
SELECT col_type_is('public', 'Chat', 'id', 'uuid', 'Chat.id should be uuid');
SELECT col_not_null('public', 'Chat', 'id', 'Chat.id should be NOT NULL');
SELECT col_not_null('public', 'Chat', 'createdAt', 'Chat.createdAt should be NOT NULL');
SELECT col_not_null('public', 'Chat', 'updatedAt', 'Chat.updatedAt should be NOT NULL');
SELECT col_not_null('public', 'Chat', 'title', 'Chat.title should be NOT NULL');
SELECT col_not_null('public', 'Chat', 'userId', 'Chat.userId should be NOT NULL');
SELECT col_not_null('public', 'Chat', 'visibility', 'Chat.visibility should be NOT NULL');
SELECT col_has_default('public', 'Chat', 'visibility', 'Chat.visibility should have default value');
SELECT col_has_default('public', 'Chat', 'isPinned', 'Chat.isPinned should have default value');

-- Test Message table constraints
SELECT col_type_is('public', 'Message', 'id', 'uuid', 'Message.id should be uuid');
SELECT col_not_null('public', 'Message', 'id', 'Message.id should be NOT NULL');
SELECT col_not_null('public', 'Message', 'chatId', 'Message.chatId should be NOT NULL');
SELECT col_not_null('public', 'Message', 'role', 'Message.role should be NOT NULL');
SELECT col_not_null('public', 'Message', 'parts', 'Message.parts should be NOT NULL');
SELECT col_not_null('public', 'Message', 'attachments', 'Message.attachments should be NOT NULL');
SELECT col_not_null('public', 'Message', 'createdAt', 'Message.createdAt should be NOT NULL');
SELECT col_has_default('public', 'Message', 'isPartial', 'Message.isPartial should have default value');
SELECT col_type_is('public', 'Message', 'selectedModel', 'character varying(256)', 'Message.selectedModel should be varchar(256)');

SELECT * FROM finish();
ROLLBACK;