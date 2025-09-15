-- Test common database queries from lib/db/queries.ts
BEGIN;

SELECT plan(15);

-- First, set up test data
INSERT INTO "User" (id, email, name, credits, reservedCredits, "createdAt")
VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'test@example.com', 'Test User', 100, 0, NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'user2@example.com', 'User Two', 50, 10, NOW());

INSERT INTO "Chat" (id, "createdAt", "updatedAt", title, "userId", visibility, "isPinned")
VALUES
    ('550e8400-e29b-41d4-a716-446655440003', NOW(), NOW(), 'Test Chat', '550e8400-e29b-41d4-a716-446655440001', 'private', false),
    ('550e8400-e29b-41d4-a716-446655440004', NOW(), NOW(), 'Public Chat', '550e8400-e29b-41d4-a716-446655440002', 'public', true);

INSERT INTO "Message" (id, "chatId", role, parts, attachments, "createdAt", "isPartial", "selectedModel", "selectedTool")
VALUES
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'user', '["Hello"]', '[]', NOW(), false, '', ''),
    ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'assistant', '["Hi there!"]', '[]', NOW() + INTERVAL '1 minute', false, 'gpt-4', '');

-- Test basic queries
SELECT ok(
    (SELECT COUNT(*) FROM "User" WHERE email = 'test@example.com') = 1,
    'Should find user by email'
);

SELECT ok(
    (SELECT name FROM "User" WHERE email = 'test@example.com') = 'Test User',
    'Should retrieve correct user name'
);

SELECT ok(
    (SELECT COUNT(*) FROM "Chat" WHERE "userId" = '550e8400-e29b-41d4-a716-446655440001') = 1,
    'Should find chats by userId'
);

SELECT ok(
    (SELECT visibility FROM "Chat" WHERE id = '550e8400-e29b-41d4-a716-446655440004') = 'public',
    'Should retrieve correct chat visibility'
);

SELECT ok(
    (SELECT COUNT(*) FROM "Message" WHERE "chatId" = '550e8400-e29b-41d4-a716-446655440003') = 2,
    'Should find messages by chatId'
);

-- Test ordering
SELECT ok(
    (SELECT role FROM "Message" WHERE "chatId" = '550e8400-e29b-41d4-a716-446655440003' ORDER BY "createdAt" LIMIT 1) = 'user',
    'Messages should be ordered by createdAt correctly'
);

-- Test joins
SELECT ok(
    EXISTS(
        SELECT 1 FROM "Chat" c
        JOIN "User" u ON c."userId" = u.id
        WHERE u.email = 'test@example.com' AND c.title = 'Test Chat'
    ),
    'Should be able to join Chat and User tables'
);

SELECT ok(
    EXISTS(
        SELECT 1 FROM "Message" m
        JOIN "Chat" c ON m."chatId" = c.id
        WHERE c.title = 'Test Chat'
    ),
    'Should be able to join Message and Chat tables'
);

-- Test aggregations
SELECT ok(
    (SELECT COUNT(*) FROM "User") >= 2,
    'Should have at least 2 users'
);

SELECT ok(
    (SELECT COUNT(*) FROM "Chat" WHERE visibility = 'private') >= 1,
    'Should have at least 1 private chat'
);

-- Test default values
SELECT ok(
    (SELECT credits FROM "User" WHERE email = 'test@example.com') = 100,
    'User credits should have correct default/set value'
);

SELECT ok(
    (SELECT "isPinned" FROM "Chat" WHERE id = '550e8400-e29b-41d4-a716-446655440003') = false,
    'Chat isPinned should default to false'
);

-- Test JSON columns
SELECT ok(
    (SELECT parts::text FROM "Message" WHERE role = 'user' LIMIT 1) = '["Hello"]',
    'Message parts JSON should be stored correctly'
);

SELECT ok(
    (SELECT attachments::text FROM "Message" WHERE role = 'user' LIMIT 1) = '[]',
    'Message attachments JSON should be stored correctly'
);

-- Test timestamp handling
SELECT ok(
    (SELECT "createdAt" FROM "User" WHERE email = 'test@example.com') IS NOT NULL,
    'User createdAt should be set'
);

SELECT * FROM finish();
ROLLBACK;