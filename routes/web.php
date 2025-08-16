<?php

use App\Http\Controllers\CrawlerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\VideoController;
use App\Models\AppSetting;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/health-check', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]);
})->name('health-check');

Route::get('/', function () {
    $settings = [
        'app_name' => AppSetting::get('app_name', '📹 Video Downloader'),
        'app_description' => AppSetting::get('app_description', 'Download videos from YouTube, Instagram, Twitter, and DoodStream directly to your Telegram'),
        'app_logo' => AppSetting::get('app_logo'),
    ];
    
    return Inertia::render('welcome', [
        'settings' => $settings,
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Video routes
    Route::resource('videos', VideoController::class)->except(['create', 'edit']);
    
    // Crawler routes
    Route::controller(CrawlerController::class)->group(function () {
        Route::get('/crawler', 'index')->name('crawler.index');
        Route::post('/crawler', 'store')->name('crawler.store');
    });
    
    // Settings routes - override the redirect in settings.php
    Route::controller(SettingsController::class)->group(function () {
        Route::get('/settings', 'index')->name('settings.index');
        Route::patch('/settings', 'update')->name('settings.update');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
