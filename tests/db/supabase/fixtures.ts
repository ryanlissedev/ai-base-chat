/**
 * Supabase-style test fixtures for consistent test data
 * Based on Supabase's recommended testing patterns
 */

import { sql } from 'drizzle-orm';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createModuleLogger } from '../../../lib/logger';

const logger = createModuleLogger('db:fixtures');

/**
 * Test user fixtures
 */
export const TEST_USERS = {
  alice: {
    id: 'test-user-alice',
    email: 'alice@test.supabase.io',
    name: 'Alice Test',
    credits: 100,
  },
  bob: {
    id: 'test-user-bob',
    email: 'bob@test.supabase.io',
    name: 'Bob Test',
    credits: 50,
  },
  charlie: {
    id: 'test-user-charlie',
    email: 'charlie@test.supabase.io',
    name: 'Charlie Test',
    credits: 0,
  },
} as const;

/**
 * Test chat fixtures
 */
export const TEST_CHATS = {
  publicChat: {
    id: 'test-chat-public',
    title: 'Public Test Chat',
    userId: TEST_USERS.alice.id,
    visibility: 'public',
  },
  privateChat: {
    id: 'test-chat-private',
    title: 'Private Test Chat',
    userId: TEST_USERS.alice.id,
    visibility: 'private',
  },
  sharedChat: {
    id: 'test-chat-shared',
    title: 'Shared Test Chat',
    userId: TEST_USERS.bob.id,
    visibility: 'public',
  },
} as const;

/**
 * Test message fixtures
 */
export const TEST_MESSAGES = {
  userMessage: {
    id: 'test-msg-user-1',
    chatId: TEST_CHATS.publicChat.id,
    role: 'user',
    content: 'Hello, this is a test message',
    sequence: 1,
  },
  assistantMessage: {
    id: 'test-msg-assistant-1',
    chatId: TEST_CHATS.publicChat.id,
    role: 'assistant',
    content: 'Hello! This is a test response',
    sequence: 2,
  },
  systemMessage: {
    id: 'test-msg-system-1',
    chatId: TEST_CHATS.privateChat.id,
    role: 'system',
    content: 'System test message',
    sequence: 1,
  },
} as const;

/**
 * Fixture loader class for managing test data
 */
export class FixtureLoader {
  private db: PostgresJsDatabase;
  private loadedFixtures: Set<string> = new Set();

  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  /**
   * Load user fixtures
   */
  async loadUsers(users = Object.values(TEST_USERS)) {
    logger.debug('Loading user fixtures');

    for (const user of users) {
      await this.db.execute(sql`
        INSERT INTO "User" (id, email, name, credits)
        VALUES (${user.id}, ${user.email}, ${user.name}, ${user.credits})
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          credits = EXCLUDED.credits
      `);
    }

    this.loadedFixtures.add('users');
    logger.debug(`Loaded ${users.length} user fixtures`);
  }

  /**
   * Load chat fixtures
   */
  async loadChats(chats = Object.values(TEST_CHATS)) {
    // Ensure users are loaded first
    if (!this.loadedFixtures.has('users')) {
      await this.loadUsers();
    }

    logger.debug('Loading chat fixtures');

    for (const chat of chats) {
      await this.db.execute(sql`
        INSERT INTO "Chat" (id, title, "userId", visibility)
        VALUES (${chat.id}, ${chat.title}, ${chat.userId}, ${chat.visibility})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          "userId" = EXCLUDED."userId",
          visibility = EXCLUDED.visibility
      `);
    }

    this.loadedFixtures.add('chats');
    logger.debug(`Loaded ${chats.length} chat fixtures`);
  }

  /**
   * Load message fixtures
   */
  async loadMessages(messages = Object.values(TEST_MESSAGES)) {
    // Ensure chats are loaded first
    if (!this.loadedFixtures.has('chats')) {
      await this.loadChats();
    }

    logger.debug('Loading message fixtures');

    for (const message of messages) {
      await this.db.execute(sql`
        INSERT INTO "Message" (id, "chatId", role, content, sequence)
        VALUES (${message.id}, ${message.chatId}, ${message.role}, ${message.content}, ${message.sequence})
        ON CONFLICT (id) DO UPDATE SET
          "chatId" = EXCLUDED."chatId",
          role = EXCLUDED.role,
          content = EXCLUDED.content,
          sequence = EXCLUDED.sequence
      `);
    }

    this.loadedFixtures.add('messages');
    logger.debug(`Loaded ${messages.length} message fixtures`);
  }

  /**
   * Load all fixtures
   */
  async loadAll() {
    logger.info('Loading all fixtures');
    await this.loadUsers();
    await this.loadChats();
    await this.loadMessages();
    logger.info('All fixtures loaded successfully');
  }

  /**
   * Clean up fixtures
   */
  async cleanup() {
    logger.debug('Cleaning up fixtures');

    // Clean in reverse dependency order
    const tables = ['Message', 'Attachment', 'Document', 'Share', 'Chat', 'User'];

    for (const table of tables) {
      await this.db.execute(sql.raw(`
        DELETE FROM "${table}"
        WHERE id LIKE 'test-%'
      `));
    }

    this.loadedFixtures.clear();
    logger.debug('Fixtures cleaned up');
  }

  /**
   * Reset fixtures (cleanup and reload)
   */
  async reset() {
    await this.cleanup();
    await this.loadAll();
  }
}

/**
 * Factory function to create a fixture loader
 */
export function createFixtureLoader(db: PostgresJsDatabase): FixtureLoader {
  return new FixtureLoader(db);
}

/**
 * Test data factory for generating dynamic test data
 */
export class TestDataFactory {
  private idCounter = 0;

  /**
   * Generate a unique test ID
   */
  generateId(prefix = 'test'): string {
    this.idCounter++;
    return `${prefix}-${Date.now()}-${this.idCounter}`;
  }

  /**
   * Create a test user
   */
  createUser(overrides?: Partial<typeof TEST_USERS.alice>) {
    return {
      id: this.generateId('user'),
      email: `test-${this.idCounter}@test.supabase.io`,
      name: `Test User ${this.idCounter}`,
      credits: 100,
      ...overrides,
    };
  }

  /**
   * Create a test chat
   */
  createChat(userId: string, overrides?: Partial<typeof TEST_CHATS.publicChat>) {
    return {
      id: this.generateId('chat'),
      title: `Test Chat ${this.idCounter}`,
      userId,
      visibility: 'private' as const,
      ...overrides,
    };
  }

  /**
   * Create a test message
   */
  createMessage(chatId: string, overrides?: Partial<typeof TEST_MESSAGES.userMessage>) {
    return {
      id: this.generateId('msg'),
      chatId,
      role: 'user' as const,
      content: `Test message ${this.idCounter}`,
      sequence: this.idCounter,
      ...overrides,
    };
  }
}

/**
 * Create a test data factory instance
 */
export function createTestDataFactory(): TestDataFactory {
  return new TestDataFactory();
}

/**
 * Enhanced factory with builder pattern for complex data generation
 */
export class TestDataBuilder {
  private factory: TestDataFactory;

  constructor() {
    this.factory = new TestDataFactory();
  }

  /**
   * Build a complete conversation with multiple messages
   */
  buildConversation(messageCount = 5) {
    const user = this.factory.createUser();
    const chat = this.factory.createChat(user.id);
    const messages = [];

    for (let i = 0; i < messageCount; i++) {
      const role = i % 2 === 0 ? 'user' : 'assistant';
      messages.push(this.factory.createMessage(chat.id, {
        role,
        sequence: i + 1,
        content: role === 'user'
          ? `User question ${i + 1}`
          : `Assistant response ${i + 1}`
      }));
    }

    return { user, chat, messages };
  }

  /**
   * Build a user with multiple chats
   */
  buildUserWithChats(chatCount = 3) {
    const user = this.factory.createUser();
    const chats = [];

    for (let i = 0; i < chatCount; i++) {
      chats.push(this.factory.createChat(user.id, {
        title: `Chat ${i + 1} for ${user.name}`,
        visibility: i === 0 ? 'public' : 'private'
      }));
    }

    return { user, chats };
  }

  /**
   * Build test data for rate limiting scenarios
   */
  buildRateLimitScenario() {
    const users = Array.from({ length: 10 }, (_, i) =>
      this.factory.createUser({
        credits: i < 5 ? 100 : 0,
        name: `RateLimit User ${i + 1}`
      })
    );

    return { users };
  }

  /**
   * Build test data for pagination testing
   */
  buildPaginationData(itemCount = 50) {
    const user = this.factory.createUser();
    const chats = Array.from({ length: itemCount }, (_, i) =>
      this.factory.createChat(user.id, {
        title: `Page Test Chat ${i + 1}`,
        createdAt: new Date(Date.now() - i * 1000000)
      })
    );

    return { user, chats };
  }

  /**
   * Build test data with relationships (users, chats, messages)
   */
  buildCompleteTestSuite() {
    const users = [
      this.factory.createUser({ name: 'Admin User', role: 'admin' }),
      this.factory.createUser({ name: 'Regular User', role: 'user' }),
      this.factory.createUser({ name: 'Premium User', credits: 1000 })
    ];

    const chats = users.flatMap(user => [
      this.factory.createChat(user.id, { visibility: 'public' }),
      this.factory.createChat(user.id, { visibility: 'private' })
    ]);

    const messages = chats.flatMap(chat => [
      this.factory.createMessage(chat.id, { role: 'user', sequence: 1 }),
      this.factory.createMessage(chat.id, { role: 'assistant', sequence: 2 })
    ]);

    return { users, chats, messages };
  }
}

/**
 * Create a test data builder instance
 */
export function createTestDataBuilder(): TestDataBuilder {
  return new TestDataBuilder();
}