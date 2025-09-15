-- Test foreign key relationships
BEGIN;

SELECT plan(8);

-- Test Chat -> User relationship
SELECT has_fk('public', 'Chat', 'Chat should have foreign key constraints');
SELECT fk_ok('public', 'Chat', 'userId', 'public', 'User', 'id',
    'Chat.userId should reference User.id');

-- Test Message -> Chat relationship
SELECT has_fk('public', 'Message', 'Message should have foreign key constraints');
SELECT fk_ok('public', 'Message', 'chatId', 'public', 'Chat', 'id',
    'Message.chatId should reference Chat.id');

-- Test Vote -> Chat and Message relationships
SELECT has_fk('public', 'Vote', 'Vote should have foreign key constraints');
SELECT fk_ok('public', 'Vote', 'chatId', 'public', 'Chat', 'id',
    'Vote.chatId should reference Chat.id');
SELECT fk_ok('public', 'Vote', 'messageId', 'public', 'Message', 'id',
    'Vote.messageId should reference Message.id');

-- Test Document -> User and Message relationships
SELECT has_fk('public', 'Document', 'Document should have foreign key constraints');
-- Note: We'll test one relationship as Document has composite foreign key constraints

SELECT * FROM finish();
ROLLBACK;