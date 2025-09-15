import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core';

export const user = pgTable(
  'User',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }),
    image: varchar('image', { length: 500 }),
    credits: integer('credits').notNull().default(100),
    reservedCredits: integer('reservedCredits').notNull().default(0),
  },
  (table) => ({
    emailIdx: index('user_email_idx').on(table.email),
    createdAtIdx: index('user_created_at_idx').on(table.createdAt),
  }),
);

export type User = InferSelectModel<typeof user>;

export const chat = pgTable(
  'Chat',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    title: text('title').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    visibility: varchar('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('private'),
    isPinned: boolean('isPinned').notNull().default(false),
  },
  (table) => ({
    userIdIdx: index('chat_user_id_idx').on(table.userId),
    updatedAtIdx: index('chat_updated_at_idx').on(table.updatedAt),
    visibilityIdx: index('chat_visibility_idx').on(table.visibility),
  }),
);

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable(
  'Message',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, {
        onDelete: 'cascade',
      }),
    parentMessageId: uuid('parentMessageId'),
    role: varchar('role').notNull(),
    parts: json('parts').notNull(),
    attachments: json('attachments').notNull(),
    createdAt: timestamp('createdAt').notNull(),
    annotations: json('annotations'),
    isPartial: boolean('isPartial').notNull().default(false),
    selectedModel: varchar('selectedModel', { length: 256 }).default(''),
    selectedTool: varchar('selectedTool', { length: 256 }).default(''),
    lastContext: json('lastContext'),
  },
  (table) => ({
    chatIdIdx: index('message_chat_id_idx').on(table.chatId),
    createdAtIdx: index('message_created_at_idx').on(table.createdAt),
    chatIdCreatedAtIdx: index('message_chat_id_created_at_idx').on(
      table.chatId,
      table.createdAt,
    ),
  }),
);

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, {
        onDelete: 'cascade',
      }),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id, {
        onDelete: 'cascade',
      }),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;
