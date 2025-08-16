import React from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';

interface Video {
    id: number;
    url: string;
    platform: string;
    title: string | null;
    filename: string | null;
    file_path: string | null;
    file_size: number | null;
    duration: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    telegram_file_url: string | null;
    telegram_message_id: string | null;
    error_message: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface Props {
    video: Video;
    [key: string]: unknown;
}

export default function VideoShow({ video }: Props) {
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this video?')) {
            router.delete(route('videos.destroy', video.id));
        }
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
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <Link href="/videos">
                                <Button variant="outline" size="sm">
                                    ← Back to Videos
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {video.title || 'Untitled Video'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Video details and playback
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(video.status)}`}>
                            {video.status === 'completed' && '✅'}
                            {video.status === 'processing' && '⏳'}
                            {video.status === 'failed' && '❌'}
                            {video.status === 'pending' && '⏸️'}
                            {' '}
                            {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video Player / Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {video.status === 'completed' && video.file_path ? (
                                <div className="aspect-video bg-black flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <div className="text-6xl mb-4">▶️</div>
                                        <p className="text-lg font-medium mb-2">Video Ready for Playback</p>
                                        <p className="text-gray-300">
                                            File: {video.filename}
                                        </p>
                                        {video.telegram_file_url && (
                                            <div className="mt-4">
                                                <a 
                                                    href={video.telegram_file_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button 
                                                        className="text-white"
                                                        style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}
                                                    >
                                                        📱 Watch on Telegram
                                                    </Button>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : video.status === 'processing' ? (
                                <div className="aspect-video bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900 dark:to-cyan-800 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">⏳</div>
                                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Processing Video...
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Your video is being downloaded and prepared
                                        </p>
                                    </div>
                                </div>
                            ) : video.status === 'failed' ? (
                                <div className="aspect-video bg-gradient-to-br from-red-100 to-pink-200 dark:from-red-900 dark:to-pink-800 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">❌</div>
                                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Download Failed
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            There was an issue processing this video
                                        </p>
                                        {video.error_message && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-2 max-w-md">
                                                {video.error_message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">⏸️</div>
                                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Pending Download
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Video is queued for processing
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Video Details */}
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                📋 Video Information
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <span className="text-lg mr-2">{getPlatformIcon(video.platform)}</span>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Platform:</span>
                                    <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">{video.platform}</span>
                                </div>
                                
                                {video.file_size && (
                                    <div className="flex items-center">
                                        <span className="text-lg mr-2">💾</span>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">File Size:</span>
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{formatFileSize(video.file_size)}</span>
                                    </div>
                                )}
                                
                                {video.duration && (
                                    <div className="flex items-center">
                                        <span className="text-lg mr-2">⏱️</span>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration:</span>
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{video.duration}</span>
                                    </div>
                                )}
                                
                                <div className="flex items-center">
                                    <span className="text-lg mr-2">📅</span>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Added:</span>
                                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                        {new Date(video.created_at).toLocaleString()}
                                    </span>
                                </div>
                                
                                {video.updated_at !== video.created_at && (
                                    <div className="flex items-center">
                                        <span className="text-lg mr-2">🔄</span>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated:</span>
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                            {new Date(video.updated_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Original URL */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                🔗 Original URL
                            </h2>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <a 
                                    href={video.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm break-all hover:underline"
                                    style={{ color: '#0cb8b6' }}
                                >
                                    {video.url}
                                </a>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                ⚡ Actions
                            </h2>
                            <div className="space-y-2">
                                {video.telegram_file_url && (
                                    <a 
                                        href={video.telegram_file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <Button 
                                            className="w-full text-white"
                                            style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}
                                        >
                                            📱 View on Telegram
                                        </Button>
                                    </a>
                                )}
                                
                                <a 
                                    href={video.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <Button variant="outline" className="w-full">
                                        🌐 View Original
                                    </Button>
                                </a>
                                
                                <Button 
                                    variant="outline" 
                                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={handleDelete}
                                >
                                    🗑️ Delete Video
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}