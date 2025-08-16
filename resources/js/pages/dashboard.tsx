import React from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface Video {
    id: number;
    title: string;
    platform: string;
    status: string;
    created_at: string;
    telegram_file_url?: string;
}

interface Props {
    stats: {
        total_videos: number;
        completed_videos: number;
        processing_videos: number;
        failed_videos: number;
    };
    platformStats: Record<string, number>;
    dailyStats: Array<{
        date: string;
        count: number;
    }>;
    recentVideos: Video[];
    [key: string]: unknown;
}

export default function Dashboard({ stats, platformStats, dailyStats, recentVideos }: Props) {
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
            case 'completed': return 'text-green-600 bg-green-100';
            case 'processing': return 'text-blue-600 bg-blue-100';
            case 'failed': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            📊 Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Overview of your video downloads and activity
                        </p>
                    </div>
                    <Link href="/crawler">
                        <Button style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}>
                            ➕ Add New Video
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="text-2xl mr-3">📹</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Videos
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_videos}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="text-2xl mr-3">✅</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Completed
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.completed_videos}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="text-2xl mr-3">⏳</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Processing
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {stats.processing_videos}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="text-2xl mr-3">❌</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Failed
                                </p>
                                <p className="text-2xl font-bold text-red-600">
                                    {stats.failed_videos}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Platform Distribution */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            📊 Videos by Platform
                        </h2>
                        <div className="space-y-3">
                            {Object.entries(platformStats).map(([platform, count]) => (
                                <div key={platform} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="text-lg mr-2">
                                            {getPlatformIcon(platform)}
                                        </span>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                                            {platform}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <div 
                                            className="h-2 rounded-full mr-3"
                                            style={{ 
                                                backgroundColor: '#0cb8b6', 
                                                width: `${Math.max(20, (count / Math.max(...Object.values(platformStats))) * 100)}px` 
                                            }}
                                        />
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(platformStats).length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                                    No videos yet. Start by adding your first video!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Daily Activity */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            📈 Daily Activity (Last 7 Days)
                        </h2>
                        <div className="space-y-3">
                            {dailyStats.map((day, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {day.date}
                                    </span>
                                    <div className="flex items-center">
                                        <div 
                                            className="h-2 rounded-full mr-3"
                                            style={{ 
                                                backgroundColor: '#0cb8b6', 
                                                width: `${Math.max(20, (day.count / Math.max(1, Math.max(...dailyStats.map(d => d.count)))) * 100)}px` 
                                            }}
                                        />
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {day.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Videos */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                🎬 Recent Videos
                            </h2>
                            <Link href="/videos">
                                <Button variant="outline" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        {recentVideos.length > 0 ? (
                            <div className="space-y-4">
                                {recentVideos.map((video) => (
                                    <div key={video.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xl">
                                                {getPlatformIcon(video.platform)}
                                            </span>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {video.title || 'Untitled Video'}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(video.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                                                {video.status}
                                            </span>
                                            {video.telegram_file_url && (
                                                <Button size="sm" variant="outline">
                                                    View on Telegram
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">📹</div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No videos yet
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    Start downloading videos from your favorite platforms
                                </p>
                                <Link href="/crawler">
                                    <Button style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}>
                                        Add Your First Video
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}