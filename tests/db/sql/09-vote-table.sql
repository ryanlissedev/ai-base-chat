-- Test Vote table specific functionality
BEGIN;

SELECT plan(10);

-- Test Vote table has composite primary key
SELECT has_pk('public', 'Vote', 'Vote table should have primary key');

-- Test Vote table column types
SELECT col_type_is('public', 'Vote', 'chatId', 'uuid', 'Vote.chatId should be uuid');
SELECT col_type_is('public', 'Vote', 'messageId', 'uuid', 'Vote.messageId should be uuid');
SELECT col_type_is('public', 'Vote', 'isUpvoted', 'boolean', 'Vote.isUpvoted should be boolean');

-- Test Vote table NOT NULL constraints
SELECT col_not_null('public', 'Vote', 'chatId', 'Vote.chatId should be NOT NULL');
SELECT col_not_null('public', 'Vote', 'messageId', 'Vote.messageId should be NOT NULL');
SELECT col_not_null('public', 'Vote', 'isUpvoted', 'Vote.isUpvoted should be NOT NULL');

-- Test Vote table foreign keys
SELECT fk_ok('public', 'Vote', 'chatId', 'public', 'Chat', 'id', 'Vote.chatId should reference Chat.id');
SELECT fk_ok('public', 'Vote', 'messageId', 'public', 'Message', 'id', 'Vote.messageId should reference Message.id');

-- Test that Vote table has the expected composite primary key columns
SELECT col_is_pk('public', 'Vote', ARRAY['chatId', 'messageId'], 'Vote should have composite primary key on chatId and messageId');

SELECT * FROM finish();
ROLLBACK;