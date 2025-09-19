-- pgTAP data integrity tests
-- Test data constraints, defaults, and business rules

BEGIN;
SELECT plan(10); -- Number of tests we plan to run

-- Setup test data
INSERT INTO "User" (id, email, name, credits)
VALUES ('test-user-1', 'test1@example.com', 'Test User 1', 100);

INSERT INTO "Chat" (id, title, "userId", visibility)
VALUES ('test-chat-1', 'Test Chat', 'test-user-1', 'private');

-- Test credit constraints
SELECT throws_ok(
  'UPDATE "User" SET credits = -10 WHERE id = ''test-user-1''',
  'P0001',
  NULL,
  'Should not allow negative credits'
);

-- Test that credits default to 0 for new users
INSERT INTO "User" (id, email, name)
VALUES ('test-user-2', 'test2@example.com', 'Test User 2');

SELECT is(
  (SELECT credits FROM "User" WHERE id = 'test-user-2'),
  0::integer,
  'New users should have 0 credits by default'
);

-- Test email uniqueness
SELECT throws_ok(
  'INSERT INTO "User" (id, email, name) VALUES (''test-user-3'', ''test1@example.com'', ''Duplicate Email'')',
  '23505',
  NULL,
  'Should not allow duplicate emails'
);

-- Test chat visibility enum
SELECT lives_ok(
  'UPDATE "Chat" SET visibility = ''public'' WHERE id = ''test-chat-1''',
  'Should allow valid visibility values'
);

-- Test message parent relationship
INSERT INTO "Message" (id, "chatId", role, content, sequence)
VALUES ('msg-1', 'test-chat-1', 'user', 'Test message', 1);

INSERT INTO "Message" (id, "chatId", role, content, sequence, "parentMessageId")
VALUES ('msg-2', 'test-chat-1', 'assistant', 'Reply', 2, 'msg-1');

SELECT is(
  (SELECT "parentMessageId" FROM "Message" WHERE id = 'msg-2'),
  'msg-1',
  'Child messages should reference parent correctly'
);

-- Test cascading deletes
DELETE FROM "Chat" WHERE id = 'test-chat-1';

SELECT is(
  (SELECT COUNT(*) FROM "Message" WHERE "chatId" = 'test-chat-1'),
  0::bigint,
  'Deleting a chat should cascade delete its messages'
);

-- Test timestamps
INSERT INTO "Chat" (id, title, "userId")
VALUES ('test-chat-2', 'Timestamp Test', 'test-user-1');

SELECT ok(
  (SELECT "createdAt" IS NOT NULL FROM "Chat" WHERE id = 'test-chat-2'),
  'createdAt should be automatically set'
);

SELECT ok(
  (SELECT "updatedAt" IS NOT NULL FROM "Chat" WHERE id = 'test-chat-2'),
  'updatedAt should be automatically set'
);

-- Test that updatedAt changes on update
SELECT pg_sleep(0.001); -- Small delay to ensure timestamp difference
UPDATE "Chat" SET title = 'Updated Title' WHERE id = 'test-chat-2';

SELECT ok(
  (SELECT "updatedAt" > "createdAt" FROM "Chat" WHERE id = 'test-chat-2'),
  'updatedAt should be greater than createdAt after update'
);

SELECT * FROM finish();
ROLLBACK;