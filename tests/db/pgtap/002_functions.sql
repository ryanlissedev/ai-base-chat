-- pgTAP function tests
-- Test database functions and stored procedures

BEGIN;
SELECT plan(5); -- Number of tests we plan to run

-- Test that basic SQL functions work
SELECT lives_ok(
  'SELECT 1',
  'Basic SELECT should work'
);

-- Test that we can query the User table
SELECT lives_ok(
  'SELECT * FROM "User" LIMIT 1',
  'Should be able to query User table'
);

-- Test that we can query the Chat table
SELECT lives_ok(
  'SELECT * FROM "Chat" LIMIT 1',
  'Should be able to query Chat table'
);

-- Test that we can join tables
SELECT lives_ok(
  'SELECT c.*, u.email FROM "Chat" c JOIN "User" u ON c."userId" = u.id LIMIT 1',
  'Should be able to join Chat and User tables'
);

-- Test that we can use transactions
SELECT lives_ok(
  $$
    BEGIN;
    INSERT INTO "User" (id, email, name) VALUES ('test-user-123', 'test@example.com', 'Test User');
    DELETE FROM "User" WHERE id = 'test-user-123';
    COMMIT;
  $$,
  'Should be able to use transactions'
);

SELECT * FROM finish();
ROLLBACK;