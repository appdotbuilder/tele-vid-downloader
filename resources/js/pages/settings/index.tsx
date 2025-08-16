import React from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';



interface Settings {
    app_name: string;
    app_description: string;
    app_logo: string | null;
    telegram_bot_token: string | null;
    telegram_bot_username: string | null;
    telegram_channel_id: string | null;
    whitelist_enabled: boolean;
    theme: string;
}

interface Props {
    settings: Settings;
    [key: string]: unknown;
}

export default function SettingsIndex({ settings }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        app_name: settings.app_name || '',
        app_description: settings.app_description || '',
        app_logo: settings.app_logo || '',
        telegram_bot_token: settings.telegram_bot_token || '',
        telegram_bot_username: settings.telegram_bot_username || '',
        telegram_channel_id: settings.telegram_channel_id || '',
        whitelist_enabled: settings.whitelist_enabled || false,
        theme: settings.theme || 'light',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('settings.update'));
    };

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ⚙️ Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Configure your application preferences and integrations
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Application Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            🏢 Application Settings
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="app_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Application Name
                                </label>
                                <input
                                    type="text"
                                    id="app_name"
                                    value={data.app_name}
                                    onChange={(e) => setData('app_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="📹 Video Downloader"
                                />
                                <InputError message={errors.app_name} className="mt-2" />
                            </div>

                            <div>
                                <label htmlFor="app_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Application Description
                                </label>
                                <textarea
                                    id="app_description"
                                    value={data.app_description}
                                    onChange={(e) => setData('app_description', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Download videos from various platforms and upload to Telegram"
                                />
                                <InputError message={errors.app_description} className="mt-2" />
                            </div>

                            <div>
                                <label htmlFor="app_logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Application Logo URL
                                </label>
                                <input
                                    type="url"
                                    id="app_logo"
                                    value={data.app_logo}
                                    onChange={(e) => setData('app_logo', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="https://example.com/logo.png"
                                />
                                <InputError message={errors.app_logo} className="mt-2" />
                                {data.app_logo && (
                                    <div className="mt-2">
                                        <img 
                                            src={data.app_logo} 
                                            alt="Logo preview" 
                                            className="w-16 h-16 object-cover rounded border"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Telegram Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            📱 Telegram Integration
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="telegram_bot_token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bot Token
                                </label>
                                <input
                                    type="text"
                                    id="telegram_bot_token"
                                    value={data.telegram_bot_token}
                                    onChange={(e) => setData('telegram_bot_token', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                                />
                                <InputError message={errors.telegram_bot_token} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Get this from @BotFather on Telegram
                                </p>
                            </div>

                            <div>
                                <label htmlFor="telegram_bot_username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bot Username
                                </label>
                                <input
                                    type="text"
                                    id="telegram_bot_username"
                                    value={data.telegram_bot_username}
                                    onChange={(e) => setData('telegram_bot_username', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="@your_bot_username"
                                />
                                <InputError message={errors.telegram_bot_username} className="mt-2" />
                            </div>

                            <div>
                                <label htmlFor="telegram_channel_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Channel/Chat ID
                                </label>
                                <input
                                    type="text"
                                    id="telegram_channel_id"
                                    value={data.telegram_channel_id}
                                    onChange={(e) => setData('telegram_channel_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="-1001234567890 or @channel_username"
                                />
                                <InputError message={errors.telegram_channel_id} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Where videos will be uploaded
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Access Control */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            🔐 Access Control
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="whitelist_enabled"
                                    checked={data.whitelist_enabled}
                                    onChange={(e) => setData('whitelist_enabled', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-cyan-500"
                                    style={{ accentColor: '#0cb8b6' }}
                                />
                                <label htmlFor="whitelist_enabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Enable User Whitelist
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                When enabled, only whitelisted Telegram users can access the application
                            </p>
                        </div>
                    </div>

                    {/* Theme Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            🎨 Appearance
                        </h2>
                        <div>
                            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Theme
                            </label>
                            <select
                                id="theme"
                                value={data.theme}
                                onChange={(e) => setData('theme', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="light">🌞 Light</option>
                                <option value="dark">🌙 Dark</option>
                            </select>
                            <InputError message={errors.theme} className="mt-2" />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button 
                            type="submit" 
                            disabled={processing}
                            style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}
                            className="text-white"
                        >
                            {processing ? '⏳ Saving...' : '💾 Save Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}