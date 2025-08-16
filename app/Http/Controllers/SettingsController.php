<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingsRequest;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     */
    public function index()
    {
        $settings = [
            'app_name' => AppSetting::get('app_name', 'Video Downloader'),
            'app_description' => AppSetting::get('app_description', 'Download videos from various platforms and upload to Telegram'),
            'app_logo' => AppSetting::get('app_logo'),
            'telegram_bot_token' => AppSetting::get('telegram_bot_token'),
            'telegram_bot_username' => AppSetting::get('telegram_bot_username'),
            'telegram_channel_id' => AppSetting::get('telegram_channel_id'),
            'whitelist_enabled' => AppSetting::get('whitelist_enabled', false),
            'theme' => AppSetting::get('theme', 'light'),
        ];

        return Inertia::render('settings/index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update the settings.
     */
    public function update(UpdateSettingsRequest $request)
    {
        $validated = $request->validated();

        foreach ($validated as $key => $value) {
            $type = match($key) {
                'whitelist_enabled' => 'boolean',
                default => 'string',
            };
            
            AppSetting::set($key, $value, $type);
        }

        return redirect()->route('settings.index')
            ->with('success', 'Settings updated successfully!');
    }
}