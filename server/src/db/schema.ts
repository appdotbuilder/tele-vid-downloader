import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  boolean, 
  integer,
  pgEnum,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const platformEnum = pgEnum('platform', ['youtube', 'instagram', 'twitter', 'doodstream', 'other']);
export const linkStatusEnum = pgEnum('link_status', ['pending', 'processing', 'downloaded', 'uploaded', 'failed']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  telegram_id: text('telegram_id').notNull().unique(),
  username: text('username'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  avatar_url: text('avatar_url'),
  is_admin: boolean('is_admin').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  telegramIdIdx: uniqueIndex('users_telegram_id_idx').on(table.telegram_id),
}));

// Telegram bots table
export const telegramBotsTable = pgTable('telegram_bots', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  token: text('token').notNull(),
  username: text('username'),
  is_default: boolean('is_default').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('telegram_bots_token_idx').on(table.token),
  isDefaultIdx: index('telegram_bots_is_default_idx').on(table.is_default),
}));

// Video links table
export const videoLinksTable = pgTable('video_links', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  url: text('url').notNull(),
  platform: platformEnum('platform').notNull(),
  status: linkStatusEnum('status').default('pending').notNull(),
  title: text('title'),
  thumbnail_url: text('thumbnail_url'),
  file_size: integer('file_size'), // in bytes
  duration: integer('duration'), // in seconds
  error_message: text('error_message'),
  telegram_bot_id: integer('telegram_bot_id').references(() => telegramBotsTable.id),
  telegram_file_id: text('telegram_file_id'),
  telegram_message_link: text('telegram_message_link'),
  downloaded_at: timestamp('downloaded_at'),
  uploaded_at: timestamp('uploaded_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('video_links_user_id_idx').on(table.user_id),
  platformIdx: index('video_links_platform_idx').on(table.platform),
  statusIdx: index('video_links_status_idx').on(table.status),
  createdAtIdx: index('video_links_created_at_idx').on(table.created_at),
  telegramBotIdIdx: index('video_links_telegram_bot_id_idx').on(table.telegram_bot_id),
}));

// Application settings table
export const appSettingsTable = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: uniqueIndex('app_settings_key_idx').on(table.key),
}));

// Whitelist table
export const whitelistTable = pgTable('whitelist', {
  id: serial('id').primaryKey(),
  telegram_id: text('telegram_id').notNull().unique(),
  added_by_user_id: integer('added_by_user_id').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  telegramIdIdx: uniqueIndex('whitelist_telegram_id_idx').on(table.telegram_id),
  addedByUserIdIdx: index('whitelist_added_by_user_id_idx').on(table.added_by_user_id),
}));

// Bot platform associations table
export const botPlatformsTable = pgTable('bot_platforms', {
  id: serial('id').primaryKey(),
  bot_id: integer('bot_id').references(() => telegramBotsTable.id).notNull(),
  platform: platformEnum('platform').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  botIdPlatformIdx: uniqueIndex('bot_platforms_bot_id_platform_idx').on(table.bot_id, table.platform),
  botIdIdx: index('bot_platforms_bot_id_idx').on(table.bot_id),
  platformIdx: index('bot_platforms_platform_idx').on(table.platform),
}));

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  videoLinks: many(videoLinksTable),
  whitelistEntries: many(whitelistTable),
}));

export const telegramBotsRelations = relations(telegramBotsTable, ({ many }) => ({
  videoLinks: many(videoLinksTable),
  botPlatforms: many(botPlatformsTable),
}));

export const videoLinksRelations = relations(videoLinksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [videoLinksTable.user_id],
    references: [usersTable.id],
  }),
  telegramBot: one(telegramBotsTable, {
    fields: [videoLinksTable.telegram_bot_id],
    references: [telegramBotsTable.id],
  }),
}));

export const whitelistRelations = relations(whitelistTable, ({ one }) => ({
  addedByUser: one(usersTable, {
    fields: [whitelistTable.added_by_user_id],
    references: [usersTable.id],
  }),
}));

export const botPlatformsRelations = relations(botPlatformsTable, ({ one }) => ({
  bot: one(telegramBotsTable, {
    fields: [botPlatformsTable.bot_id],
    references: [telegramBotsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type TelegramBot = typeof telegramBotsTable.$inferSelect;
export type NewTelegramBot = typeof telegramBotsTable.$inferInsert;

export type VideoLink = typeof videoLinksTable.$inferSelect;
export type NewVideoLink = typeof videoLinksTable.$inferInsert;

export type AppSettings = typeof appSettingsTable.$inferSelect;
export type NewAppSettings = typeof appSettingsTable.$inferInsert;

export type Whitelist = typeof whitelistTable.$inferSelect;
export type NewWhitelist = typeof whitelistTable.$inferInsert;

export type BotPlatform = typeof botPlatformsTable.$inferSelect;
export type NewBotPlatform = typeof botPlatformsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  telegramBots: telegramBotsTable,
  videoLinks: videoLinksTable,
  appSettings: appSettingsTable,
  whitelist: whitelistTable,
  botPlatforms: botPlatformsTable,
};