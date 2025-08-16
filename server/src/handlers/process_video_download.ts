import * as fs from 'fs/promises';
import * as path from 'path';
import { db } from '../db';
import { telegramBotsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

interface VideoMetadata {
    title: string;
    thumbnail_url?: string;
    duration?: number;
    download_url: string;
}

interface DownloadResult {
    success: boolean;
    file_path?: string;
    file_size?: number;
    error?: string;
}

interface TelegramUploadResult {
    success: boolean;
    file_id?: string;
    message_link?: string;
    error?: string;
}

interface LeechAPIResponse {
    success: boolean;
    data?: {
        title?: string;
        thumbnail?: string;
        duration?: number;
        download_url: string;
    };
    error?: string;
}

interface TelegramBotAPIResponse {
    ok: boolean;
    result?: {
        message_id: number;
        document?: {
            file_id: string;
        };
        video?: {
            file_id: string;
        };
    };
    description?: string;
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata | null> {
    try {
        const apiKey = process.env['LEECH_API_KEY'];
        if (!apiKey) {
            throw new Error('LEECH_API_KEY environment variable is required');
        }

        const response = await fetch('https://globals.zapps.cloud/api/leech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as LeechAPIResponse;

        if (!data.success || !data.data) {
            throw new Error(data.error || 'Failed to fetch video metadata');
        }

        return {
            title: data.data.title || 'Untitled Video',
            thumbnail_url: data.data.thumbnail,
            duration: data.data.duration,
            download_url: data.data.download_url,
        };
    } catch (error) {
        console.error('Video metadata fetch failed:', error);
        return null;
    }
}

export async function downloadVideo(downloadUrl: string, fileName: string): Promise<DownloadResult> {
    try {
        // Ensure downloads directory exists
        const downloadsDir = path.join(process.cwd(), 'downloads');
        await fs.mkdir(downloadsDir, { recursive: true });

        // Sanitize filename to prevent path traversal
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(downloadsDir, sanitizedFileName);

        // Download the video file
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('No response body received');
        }

        // Create write stream and pipe the response
        const buffer = await response.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(buffer));

        // Get file size
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;

        return {
            success: true,
            file_path: filePath,
            file_size: fileSize,
        };
    } catch (error) {
        console.error('Video download failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown download error',
        };
    }
}

export async function uploadToTelegram(filePath: string, botId: number, chatId?: string): Promise<TelegramUploadResult> {
    try {
        // Get bot token from database
        const bots = await db.select()
            .from(telegramBotsTable)
            .where(eq(telegramBotsTable.id, botId))
            .execute();

        if (bots.length === 0) {
            throw new Error(`Bot with ID ${botId} not found`);
        }

        const bot = bots[0];
        if (!bot.is_active) {
            throw new Error(`Bot ${bot.name} is not active`);
        }

        // Use environment variable for chat ID if not provided
        const targetChatId = chatId || process.env['TELEGRAM_CHAT_ID'];
        if (!targetChatId) {
            throw new Error('Chat ID is required for Telegram upload');
        }

        // Check if file exists and get its stats
        const stats = await fs.stat(filePath);
        if (stats.size > 50 * 1024 * 1024) { // 50MB limit for Telegram
            throw new Error('File size exceeds Telegram limit (50MB)');
        }

        // Read file content
        const fileBuffer = await fs.readFile(filePath);
        const fileName = path.basename(filePath);

        // Create form data for Telegram API
        const formData = new FormData();
        formData.append('chat_id', targetChatId);
        formData.append('document', new Blob([fileBuffer]), fileName);

        // Upload to Telegram
        const response = await fetch(`https://api.telegram.org/bot${bot.token}/sendDocument`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Telegram API error! status: ${response.status}`);
        }

        const data = await response.json() as TelegramBotAPIResponse;

        if (!data.ok) {
            throw new Error(data.description || 'Telegram API request failed');
        }

        if (!data.result) {
            throw new Error('No result received from Telegram API');
        }

        // Extract file_id from document or video
        const fileId = data.result.document?.file_id || data.result.video?.file_id;
        if (!fileId) {
            throw new Error('No file_id received from Telegram');
        }

        // Create message link
        const messageLink = bot.username 
            ? `https://t.me/${bot.username}/${data.result.message_id}`
            : undefined;

        return {
            success: true,
            file_id: fileId,
            message_link: messageLink,
        };
    } catch (error) {
        console.error('Telegram upload failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown upload error',
        };
    }
}

export async function cleanupLocalFile(filePath: string): Promise<boolean> {
    try {
        // Check if file exists before attempting to delete
        await fs.access(filePath);
        
        // Delete the file
        await fs.unlink(filePath);
        
        return true;
    } catch (error) {
        // If file doesn't exist, consider it as successfully cleaned up
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return true;
        }
        
        console.error('File cleanup failed:', error);
        return false;
    }
}