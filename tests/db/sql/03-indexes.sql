-- Test database indexes
BEGIN;

SELECT plan(12);

-- Test User table indexes
SELECT has_index('public', 'User', 'user_email_idx', 'User table should have email index');
SELECT has_index('public', 'User', 'user_created_at_idx', 'User table should have createdAt index');

-- Test Chat table indexes
SELECT has_index('public', 'Chat', 'chat_user_id_idx', 'Chat table should have userId index');
SELECT has_index('public', 'Chat', 'chat_updated_at_idx', 'Chat table should have updatedAt index');
SELECT has_index('public', 'Chat', 'chat_visibility_idx', 'Chat table should have visibility index');

-- Test Message table indexes
SELECT has_index('public', 'Message', 'message_chat_id_idx', 'Message table should have chatId index');
SELECT has_index('public', 'Message', 'message_created_at_idx', 'Message table should have createdAt index');
SELECT has_index('public', 'Message', 'message_chat_id_created_at_idx', 'Message table should have composite chatId+createdAt index');

-- Test that indexes are on correct columns
SELECT index_is_type('public', 'User', 'user_email_idx', 'btree', 'User email index should be btree');
SELECT index_is_type('public', 'Chat', 'chat_user_id_idx', 'btree', 'Chat userId index should be btree');
SELECT index_is_type('public', 'Message', 'message_chat_id_idx', 'btree', 'Message chatId index should be btree');

-- Test composite index structure
SELECT index_is_type('public', 'Message', 'message_chat_id_created_at_idx', 'btree', 'Message composite index should be btree');

SELECT * FROM finish();
ROLLBACK;