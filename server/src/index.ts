import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schema imports
import { 
  createUserInputSchema,
  createTelegramBotInputSchema,
  createVideoLinkInputSchema,
  updateVideoLinkInputSchema,
  updateAppSettingsInputSchema,
  createWhitelistInputSchema,
  createBotPlatformInputSchema,
  videoLinkFiltersSchema,
  dashboardStatsSchema
} from './schema';

// Handler imports
import { createUser } from './handlers/create_user';
import { getUserByTelegramId } from './handlers/get_user_by_telegram_id';
import { createTelegramBot } from './handlers/create_telegram_bot';
import { getTelegramBots } from './handlers/get_telegram_bots';
import { createVideoLink } from './handlers/create_video_link';
import { getVideoLinks } from './handlers/get_video_links';
import { updateVideoLink } from './handlers/update_video_link';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { getAppSettings, getAppSettingByKey } from './handlers/get_app_settings';
import { updateAppSettings } from './handlers/update_app_settings';
import { 
  addToWhitelist, 
  removeFromWhitelist, 
  getWhitelist, 
  isWhitelisted 
} from './handlers/manage_whitelist';
import { 
  assignBotToPlatform, 
  removeBotFromPlatform, 
  getBotForPlatform, 
  getBotPlatformAssignments 
} from './handlers/manage_bot_platforms';
import { 
  fetchVideoMetadata, 
  downloadVideo, 
  uploadToTelegram, 
  cleanupLocalFile 
} from './handlers/process_video_download';
import { detectPlatformFromUrl, validateUrl } from './handlers/detect_platform';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUserByTelegramId: publicProcedure
    .input(z.string())
    .query(({ input }) => getUserByTelegramId(input)),

  // Telegram bot management
  createTelegramBot: publicProcedure
    .input(createTelegramBotInputSchema)
    .mutation(({ input }) => createTelegramBot(input)),
  
  getTelegramBots: publicProcedure
    .query(() => getTelegramBots()),

  // Video link management
  createVideoLink: publicProcedure
    .input(createVideoLinkInputSchema)
    .mutation(({ input }) => createVideoLink(input)),
  
  getVideoLinks: publicProcedure
    .input(videoLinkFiltersSchema)
    .query(({ input }) => getVideoLinks(input)),
  
  updateVideoLink: publicProcedure
    .input(updateVideoLinkInputSchema)
    .mutation(({ input }) => updateVideoLink(input)),

  // Dashboard statistics
  getDashboardStats: publicProcedure
    .input(dashboardStatsSchema)
    .query(({ input }) => getDashboardStats(input)),

  // Application settings
  getAppSettings: publicProcedure
    .query(() => getAppSettings()),
  
  getAppSettingByKey: publicProcedure
    .input(z.string())
    .query(({ input }) => getAppSettingByKey(input)),
  
  updateAppSettings: publicProcedure
    .input(updateAppSettingsInputSchema)
    .mutation(({ input }) => updateAppSettings(input)),

  // Whitelist management
  addToWhitelist: publicProcedure
    .input(createWhitelistInputSchema)
    .mutation(({ input }) => addToWhitelist(input)),
  
  removeFromWhitelist: publicProcedure
    .input(z.string())
    .mutation(({ input }) => removeFromWhitelist(input)),
  
  getWhitelist: publicProcedure
    .query(() => getWhitelist()),
  
  isWhitelisted: publicProcedure
    .input(z.string())
    .query(({ input }) => isWhitelisted(input)),

  // Bot platform assignments
  assignBotToPlatform: publicProcedure
    .input(createBotPlatformInputSchema)
    .mutation(({ input }) => assignBotToPlatform(input)),
  
  removeBotFromPlatform: publicProcedure
    .input(z.object({ 
      botId: z.number(), 
      platform: z.enum(['youtube', 'instagram', 'twitter', 'doodstream', 'other']) 
    }))
    .mutation(({ input }) => removeBotFromPlatform(input.botId, input.platform)),
  
  getBotForPlatform: publicProcedure
    .input(z.enum(['youtube', 'instagram', 'twitter', 'doodstream', 'other']))
    .query(({ input }) => getBotForPlatform(input)),
  
  getBotPlatformAssignments: publicProcedure
    .query(() => getBotPlatformAssignments()),

  // Video processing utilities
  fetchVideoMetadata: publicProcedure
    .input(z.string().url())
    .query(({ input }) => fetchVideoMetadata(input)),
  
  downloadVideo: publicProcedure
    .input(z.object({ 
      downloadUrl: z.string().url(), 
      fileName: z.string() 
    }))
    .mutation(({ input }) => downloadVideo(input.downloadUrl, input.fileName)),
  
  uploadToTelegram: publicProcedure
    .input(z.object({ 
      filePath: z.string(), 
      botId: z.number(), 
      chatId: z.string().optional() 
    }))
    .mutation(({ input }) => uploadToTelegram(input.filePath, input.botId, input.chatId)),
  
  cleanupLocalFile: publicProcedure
    .input(z.string())
    .mutation(({ input }) => cleanupLocalFile(input)),

  // Platform detection
  detectPlatformFromUrl: publicProcedure
    .input(z.string().url())
    .query(({ input }) => detectPlatformFromUrl(input)),
  
  validateUrl: publicProcedure
    .input(z.string().url())
    .query(({ input }) => validateUrl(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Video Downloader TRPC server listening at port: ${port}`);
}

start();