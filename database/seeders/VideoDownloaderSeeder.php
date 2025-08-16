<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Seeder;

class VideoDownloaderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default app settings
        AppSetting::create([
            'key' => 'app_name',
            'value' => '📹 Video Downloader',
            'type' => 'string',
        ]);

        AppSetting::create([
            'key' => 'app_description',
            'value' => 'Download videos from YouTube, Instagram, Twitter, and DoodStream directly to your Telegram',
            'type' => 'string',
        ]);

        AppSetting::create([
            'key' => 'telegram_bot_token',
            'value' => '',
            'type' => 'string',
        ]);

        AppSetting::create([
            'key' => 'telegram_bot_username',
            'value' => '',
            'type' => 'string',
        ]);

        AppSetting::create([
            'key' => 'telegram_channel_id',
            'value' => '',
            'type' => 'string',
        ]);

        AppSetting::create([
            'key' => 'whitelist_enabled',
            'value' => '0',
            'type' => 'boolean',
        ]);

        AppSetting::create([
            'key' => 'theme',
            'value' => 'light',
            'type' => 'string',
        ]);

        // Create a demo user with some videos for testing
        if (app()->environment('local')) {
            $user = User::factory()->create([
                'name' => 'Demo User',
                'email' => 'demo@example.com',
                'password' => bcrypt('password'),
            ]);

            // Create some sample videos with different statuses
            Video::factory()->completed()->create([
                'user_id' => $user->id,
                'url' => 'https://youtube.com/watch?v=dQw4w9WgXcQ',
                'platform' => 'youtube',
                'title' => 'Rick Astley - Never Gonna Give You Up',
            ]);

            Video::factory()->processing()->create([
                'user_id' => $user->id,
                'url' => 'https://instagram.com/p/sample123',
                'platform' => 'instagram',
                'title' => 'Instagram Video Sample',
            ]);

            Video::factory()->failed()->create([
                'user_id' => $user->id,
                'url' => 'https://twitter.com/user/status/123456789',
                'platform' => 'twitter',
                'title' => 'Failed Twitter Video',
                'error_message' => 'Video is private or has been deleted',
            ]);

            Video::factory()->count(5)->completed()->create([
                'user_id' => $user->id,
            ]);

            Video::factory()->count(3)->processing()->create([
                'user_id' => $user->id,
            ]);
        }
    }
}