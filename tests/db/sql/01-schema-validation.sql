-- Test schema validation for all tables
BEGIN;

SELECT plan(30);

-- Test that all required tables exist
SELECT has_table('public', 'User', 'User table should exist');
SELECT has_table('public', 'Chat', 'Chat table should exist');
SELECT has_table('public', 'Message', 'Message table should exist');
SELECT has_table('public', 'Vote', 'Vote table should exist');
SELECT has_table('public', 'Document', 'Document table should exist');
SELECT has_table('public', 'Suggestion', 'Suggestion table should exist');

-- Test User table structure
SELECT has_column('public', 'User', 'id', 'User table should have id column');
SELECT has_column('public', 'User', 'createdAt', 'User table should have createdAt column');
SELECT has_column('public', 'User', 'email', 'User table should have email column');
SELECT has_column('public', 'User', 'name', 'User table should have name column');
SELECT has_column('public', 'User', 'image', 'User table should have image column');
SELECT has_column('public', 'User', 'credits', 'User table should have credits column');
SELECT has_column('public', 'User', 'reservedCredits', 'User table should have reservedCredits column');

-- Test Chat table structure
SELECT has_column('public', 'Chat', 'id', 'Chat table should have id column');
SELECT has_column('public', 'Chat', 'createdAt', 'Chat table should have createdAt column');
SELECT has_column('public', 'Chat', 'updatedAt', 'Chat table should have updatedAt column');
SELECT has_column('public', 'Chat', 'title', 'Chat table should have title column');
SELECT has_column('public', 'Chat', 'userId', 'Chat table should have userId column');
SELECT has_column('public', 'Chat', 'visibility', 'Chat table should have visibility column');
SELECT has_column('public', 'Chat', 'isPinned', 'Chat table should have isPinned column');

-- Test Message table structure
SELECT has_column('public', 'Message', 'id', 'Message table should have id column');
SELECT has_column('public', 'Message', 'chatId', 'Message table should have chatId column');
SELECT has_column('public', 'Message', 'parentMessageId', 'Message table should have parentMessageId column');
SELECT has_column('public', 'Message', 'role', 'Message table should have role column');
SELECT has_column('public', 'Message', 'parts', 'Message table should have parts column');
SELECT has_column('public', 'Message', 'attachments', 'Message table should have attachments column');
SELECT has_column('public', 'Message', 'createdAt', 'Message table should have createdAt column');
SELECT has_column('public', 'Message', 'annotations', 'Message table should have annotations column');
SELECT has_column('public', 'Message', 'isPartial', 'Message table should have isPartial column');
SELECT has_column('public', 'Message', 'selectedModel', 'Message table should have selectedModel column');
SELECT has_column('public', 'Message', 'selectedTool', 'Message table should have selectedTool column');
SELECT has_column('public', 'Message', 'lastContext', 'Message table should have lastContext column');

SELECT * FROM finish();
ROLLBACK;