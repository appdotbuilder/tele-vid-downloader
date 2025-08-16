import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  telegram_id: z.string(),
  username: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  is_admin: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Telegram Bot schema
export const telegramBotSchema = z.object({
  id: z.number(),
  name: z.string(),
  token: z.string(),
  username: z.string().nullable(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TelegramBot = z.infer<typeof telegramBotSchema>;

// Platform enum
export const platformEnum = z.enum(['youtube', 'instagram', 'twitter', 'doodstream', 'other']);
export type Platform = z.infer<typeof platformEnum>;

// Video Link status enum
export const linkStatusEnum = z.enum(['pending', 'processing', 'downloaded', 'uploaded', 'failed']);
export type LinkStatus = z.infer<typeof linkStatusEnum>;

// Video Link schema
export const videoLinkSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  url: z.string().url(),
  platform: platformEnum,
  status: linkStatusEnum,
  title: z.string().nullable(),
  thumbnail_url: z.string().url().nullable(),
  file_size: z.number().nullable(),
  duration: z.number().nullable(),
  error_message: z.string().nullable(),
  telegram_bot_id: z.number().nullable(),
  telegram_file_id: z.string().nullable(),
  telegram_message_link: z.string().nullable(),
  downloaded_at: z.coerce.date().nullable(),
  uploaded_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type VideoLink = z.infer<typeof videoLinkSchema>;

// Application Settings schema
export const appSettingsSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

// Whitelist schema
export const whitelistSchema = z.object({
  id: z.number(),
  telegram_id: z.string(),
  added_by_user_id: z.number(),
  created_at: z.coerce.date()
});

export type Whitelist = z.infer<typeof whitelistSchema>;

// Bot Platform Association schema
export const botPlatformSchema = z.object({
  id: z.number(),
  bot_id: z.number(),
  platform: platformEnum,
  created_at: z.coerce.date()
});

export type BotPlatform = z.infer<typeof botPlatformSchema>;

// Input schemas for creating entities

export const createUserInputSchema = z.object({
  telegram_id: z.string(),
  username: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  is_admin: z.boolean().default(false)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createTelegramBotInputSchema = z.object({
  name: z.string().min(1),
  token: z.string().min(1),
  username: z.string().nullable(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true)
});

export type CreateTelegramBotInput = z.infer<typeof createTelegramBotInputSchema>;

export const createVideoLinkInputSchema = z.object({
  user_id: z.number(),
  url: z.string().url(),
  platform: platformEnum.optional() // Will be auto-detected if not provided
});

export type CreateVideoLinkInput = z.infer<typeof createVideoLinkInputSchema>;

export const updateVideoLinkInputSchema = z.object({
  id: z.number(),
  status: linkStatusEnum.optional(),
  title: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  file_size: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
  error_message: z.string().nullable().optional(),
  telegram_bot_id: z.number().nullable().optional(),
  telegram_file_id: z.string().nullable().optional(),
  telegram_message_link: z.string().nullable().optional(),
  downloaded_at: z.coerce.date().nullable().optional(),
  uploaded_at: z.coerce.date().nullable().optional()
});

export type UpdateVideoLinkInput = z.infer<typeof updateVideoLinkInputSchema>;

export const createAppSettingsInputSchema = z.object({
  key: z.string().min(1),
  value: z.string().nullable()
});

export type CreateAppSettingsInput = z.infer<typeof createAppSettingsInputSchema>;

export const updateAppSettingsInputSchema = z.object({
  key: z.string(),
  value: z.string().nullable()
});

export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsInputSchema>;

export const createWhitelistInputSchema = z.object({
  telegram_id: z.string(),
  added_by_user_id: z.number()
});

export type CreateWhitelistInput = z.infer<typeof createWhitelistInputSchema>;

export const createBotPlatformInputSchema = z.object({
  bot_id: z.number(),
  platform: platformEnum
});

export type CreateBotPlatformInput = z.infer<typeof createBotPlatformInputSchema>;

// Query schemas for filtering and pagination

export const videoLinkFiltersSchema = z.object({
  platform: platformEnum.optional(),
  status: linkStatusEnum.optional(),
  user_id: z.number().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type VideoLinkFilters = z.infer<typeof videoLinkFiltersSchema>;

export const dashboardStatsSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  days: z.number().int().positive().max(365).default(30)
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Response schemas for API endpoints

export const paginatedVideoLinksSchema = z.object({
  data: z.array(videoLinkSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

export type PaginatedVideoLinks = z.infer<typeof paginatedVideoLinksSchema>;

export const statsResponseSchema = z.object({
  total_links: z.number(),
  total_users: z.number(),
  links_by_platform: z.record(platformEnum, z.number()),
  links_by_status: z.record(linkStatusEnum, z.number()),
  daily_stats: z.array(z.object({
    date: z.string(),
    links_count: z.number(),
    users_count: z.number()
  }))
});

export type StatsResponse = z.infer<typeof statsResponseSchema>;