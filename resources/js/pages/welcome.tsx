import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLogo from '@/components/app-logo';

interface Props {
    settings: {
        app_name: string;
        app_description: string;
        app_logo?: string;
    };
    [key: string]: unknown;
}

export default function Welcome({ settings }: Props) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            {settings.app_logo ? (
                                <img src={settings.app_logo} alt="Logo" className="w-8 h-8" />
                            ) : (
                                <div className="w-8 h-8">
                                    <AppLogo />
                                </div>
                            )}
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {settings.app_name}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login">
                                <Button variant="outline">Login</Button>
                            </Link>
                            <Link href="/register">
                                <Button style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}>
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <div className="mb-8">
                        <div className="text-6xl mb-4">📹</div>
                        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            {settings.app_name}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {settings.app_description}
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl mb-3">🎬</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                YouTube Videos
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Download any YouTube video directly to your Telegram
                            </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl mb-3">📸</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Instagram Content
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Save Instagram videos and stories effortlessly
                            </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl mb-3">🐦</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Twitter Videos
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Download videos from Twitter/X posts instantly
                            </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl mb-3">📱</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Telegram Upload
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Automatic upload to your Telegram bot
                            </p>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            ⚡ How It Works
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold" 
                                     style={{ backgroundColor: '#0cb8b6' }}>
                                    1
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Paste Video URL
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Copy any video URL from supported platforms
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold" 
                                     style={{ backgroundColor: '#0cb8b6' }}>
                                    2
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Processing Magic
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Our system downloads and processes the video
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold" 
                                     style={{ backgroundColor: '#0cb8b6' }}>
                                    3
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Get Telegram Link
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Receive a direct Telegram link to your video
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            🚀 Ready to Start?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Join thousands of users who trust us with their video downloads
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Link href="/register">
                                <Button 
                                    size="lg" 
                                    className="px-8 py-3 text-white"
                                    style={{ backgroundColor: '#0cb8b6', borderColor: '#0cb8b6' }}
                                >
                                    🎯 Get Started Free
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="lg" className="px-8 py-3">
                                    📱 Login with Telegram
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-600 dark:text-gray-400">
                        <p className="mb-2">
                            🔒 Secure • ⚡ Fast • 🌍 Multi-Platform
                        </p>
                        <p className="text-sm">
                            Download videos from YouTube, Instagram, Twitter, and DoodStream with confidence
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}