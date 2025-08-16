import React, { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface Video {
    id: number;
    url: string;
    platform: string;
    title: string | null;
    filename: string | null;
    file_path: string | null;
    file_size: number | null;
    status: string;
    created_at: string;
    telegram_file_url: string | null;
    telegram_message_id: string | null;
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

export default function VideosIndex({ videos, filters, platforms, statuses }: Props) {
    const [selectedPlatform, setSelectedPlatform] = useState(filters.platform || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleFilter = () => {
        const params = new URLSearchParams();
        if (selectedPlatform) params.set('platform', selectedPlatform);
        if (selectedStatus) params.set('status', selectedStatus);
        
        window.location.href = route('videos.index') + '?' + params.toString();
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

    const formatFileSize = (bytes: number | null): string => {
        if (!bytes) return 'Unknown';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let i = 0;
        
        while (size > 1024 && i < sizes.length - 1) {
            size /= 1024;
            i++;
        }
        
        return Math.round(size * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            🎬 My Videos
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            All your downloaded videos in one place
                        </p>
                    </div>
                    <Link href="/crawler">
                        <Button style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}>
                            ➕ Add New Video
                        </Button>
                    </Link>
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
                                    window.location.href = route('videos.index');
                                }}
                                variant="outline"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Videos Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.data.length > 0 ? (
                        videos.data.map((video) => (
                            <div key={video.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                {/* Video Thumbnail/Icon */}
                                <div className="aspect-video bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                    <div className="text-6xl">
                                        {getPlatformIcon(video.platform)}
                                    </div>
                                </div>
                                
                                {/* Video Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                            {video.title || 'Untitled Video'}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${getStatusColor(video.status)}`}>
                                            {video.status === 'completed' && '✅'}
                                            {video.status === 'processing' && '⏳'}
                                            {video.status === 'failed' && '❌'}
                                            {video.status === 'pending' && '⏸️'}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <span className="mr-2">{getPlatformIcon(video.platform)}</span>
                                            <span className="capitalize">{video.platform}</span>
                                        </div>
                                        
                                        {video.file_size && (
                                            <div className="flex items-center">
                                                <span className="mr-2">💾</span>
                                                <span>{formatFileSize(video.file_size)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center">
                                            <span className="mr-2">📅</span>
                                            <span>{new Date(video.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex space-x-2 mt-4">
                                        {video.status === 'completed' && video.file_path && (
                                            <Button size="sm" variant="outline" className="flex-1">
                                                ▶️ Play
                                            </Button>
                                        )}
                                        
                                        {video.telegram_file_url && (
                                            <a 
                                                href={video.telegram_file_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex-1"
                                            >
                                                <Button 
                                                    size="sm" 
                                                    className="w-full text-white"
                                                    style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}
                                                >
                                                    📱 Telegram
                                                </Button>
                                            </a>
                                        )}
                                        
                                        <Link href={route('videos.show', video.id)}>
                                            <Button size="sm" variant="outline">
                                                👁️ View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <div className="text-6xl mb-4">🎬</div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No videos found
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    {(selectedPlatform || selectedStatus) 
                                        ? 'Try adjusting your filters or add some videos' 
                                        : 'Start downloading videos from your favorite platforms'}
                                </p>
                                <Link href="/crawler">
                                    <Button style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}>
                                        Add Your First Video
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination would go here if needed */}
                {videos.meta && typeof videos.meta === 'object' && 
                 'last_page' in videos.meta && 
                 typeof videos.meta.last_page === 'number' && 
                 videos.meta.last_page > 1 && (
                    <div className="flex justify-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Page {String(videos.meta.current_page || 1)} of {String(videos.meta.last_page)} 
                                ({String(videos.meta.total || 0)} total videos)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}