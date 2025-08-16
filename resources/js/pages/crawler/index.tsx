import React, { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';

interface Video {
    id: number;
    url: string;
    platform: string;
    title: string | null;
    status: string;
    created_at: string;
    telegram_file_url: string | null;
    error_message: string | null;
}

interface Props {
    videos: {
        data: Video[];
        links: Record<string, unknown>;
        meta: Record<string, unknown>;
    };
    filters: {
        platform?: string;
        status?: string;
    };
    platforms: string[];
    statuses: string[];
    [key: string]: unknown;
}

export default function CrawlerIndex({ videos, filters, platforms, statuses }: Props) {
    const [selectedPlatform, setSelectedPlatform] = useState(filters.platform || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const { data, setData, post, processing, errors, reset } = useForm<{
        url: string;
    }>({
        url: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('crawler.store'), {
            preserveState: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    const handleFilter = () => {
        const params = new URLSearchParams();
        if (selectedPlatform) params.set('platform', selectedPlatform);
        if (selectedStatus) params.set('status', selectedStatus);
        
        window.location.href = route('crawler.index') + '?' + params.toString();
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'youtube': return '🎬';
            case 'instagram': return '📸';
            case 'twitter': return '🐦';
            case 'doodstream': return '📹';
            default: return '📱';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
            case 'processing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
            case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const renderEmptyState = () => (
        <div className="text-center py-12">
            <div className="text-4xl mb-4">🕷️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No videos found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
                {(selectedPlatform || selectedStatus) 
                    ? 'Try adjusting your filters or add some videos' 
                    : 'Add your first video URL above to get started'}
            </p>
        </div>
    );

    const renderVideoList = () => (
        <div className="space-y-4">
            {videos.data.map((video) => (
                <div key={video.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                            <span className="text-2xl">
                                {getPlatformIcon(video.platform)}
                            </span>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {video.title || 'Untitled Video'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                                    {video.url}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Added on {new Date(video.created_at).toLocaleDateString()}
                                </p>
                                {video.error_message && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        ❌ {video.error_message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                                {video.status === 'completed' && '✅'}
                                {video.status === 'processing' && '⏳'}
                                {video.status === 'failed' && '❌'}
                                {video.status === 'pending' && '⏸️'}
                                {' '}
                                {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                            </span>
                            {video.telegram_file_url && (
                                <a 
                                    href={video.telegram_file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button size="sm" variant="outline">
                                        📱 View on Telegram
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        🕷️ Video Crawler
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Add video URLs to download and upload to Telegram
                    </p>
                </div>

                {/* Add Video Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        ➕ Add New Video
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Video URL
                            </label>
                            <input
                                type="url"
                                id="url"
                                value={data.url}
                                onChange={(e) => setData('url', e.target.value)}
                                placeholder="https://youtube.com/watch?v=... or https://instagram.com/..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                disabled={processing}
                            />
                            <InputError message={errors.url} className="mt-2" />
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                🎬 YouTube • 📸 Instagram • 🐦 Twitter • 📹 DoodStream
                            </p>
                        </div>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}
                        >
                            {processing ? '⏳ Processing...' : '🚀 Start Download'}
                        </Button>
                    </form>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        🔍 Filter Videos
                    </h2>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Platform
                            </label>
                            <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">All Platforms</option>
                                {platforms.map((platform) => (
                                    <option key={platform} value={platform}>
                                        {getPlatformIcon(platform)} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button onClick={handleFilter} variant="outline">
                            Apply Filters
                        </Button>
                        {(selectedPlatform || selectedStatus) && (
                            <Button 
                                onClick={() => {
                                    setSelectedPlatform('');
                                    setSelectedStatus('');
                                    window.location.href = route('crawler.index');
                                }}
                                variant="outline"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Videos List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            📋 Your Videos ({(videos.meta && typeof videos.meta === 'object' && 'total' in videos.meta ? String(videos.meta.total) : '0')})
                        </h2>
                    </div>
                    <div className="p-6">
                        {videos.data.length > 0 ? renderVideoList() : renderEmptyState()}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}