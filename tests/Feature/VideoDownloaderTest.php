<?php

use App\Models\AppSetting;
use App\Models\User;
use App\Models\Video;

beforeEach(function () {
    $this->user = User::factory()->create();
    
    // Seed basic settings
    AppSetting::create(['key' => 'app_name', 'value' => 'Video Downloader', 'type' => 'string']);
    AppSetting::create(['key' => 'app_description', 'value' => 'Test app', 'type' => 'string']);
});

test('welcome page displays correctly', function () {
    $response = $this->get('/');
    
    $response->assertStatus(200);
    $response->assertInertia(fn ($assert) => $assert
        ->component('welcome')
        ->has('settings')
        ->where('settings.app_name', 'Video Downloader')
    );
});

test('dashboard requires authentication', function () {
    $response = $this->get('/dashboard');
    
    $response->assertRedirect('/login');
});

test('authenticated user can access dashboard', function () {
    $response = $this->actingAs($this->user)->get('/dashboard');
    
    $response->assertStatus(200);
    $response->assertInertia(fn ($assert) => $assert
        ->component('dashboard')
        ->has('stats')
        ->has('platformStats')
        ->has('dailyStats')
        ->has('recentVideos')
    );
});

test('user can submit video url', function () {
    $videoData = [
        'url' => 'https://youtube.com/watch?v=test123',
    ];

    $response = $this->actingAs($this->user)->post('/crawler', $videoData);
    
    $response->assertRedirect('/crawler');
    $response->assertSessionHas('success', 'Video download request submitted successfully!');
    
    $this->assertDatabaseHas('videos', [
        'user_id' => $this->user->id,
        'url' => 'https://youtube.com/watch?v=test123',
        'platform' => 'youtube',
        'status' => 'pending',
    ]);
});

test('invalid url is rejected', function () {
    $videoData = [
        'url' => 'https://unsupported.com/video123',
    ];

    $response = $this->actingAs($this->user)->post('/crawler', $videoData);
    
    $response->assertSessionHasErrors('url');
    
    $this->assertDatabaseMissing('videos', [
        'user_id' => $this->user->id,
        'url' => 'https://unsupported.com/video123',
    ]);
});

test('user can view their videos', function () {
    $video = Video::factory()->create([
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->get('/videos');
    
    $response->assertStatus(200);
    $response->assertInertia(fn ($assert) => $assert
        ->component('videos/index')
        ->has('videos.data', 1)
    );
});

test('user cannot view other users videos', function () {
    $otherUser = User::factory()->create();
    $video = Video::factory()->create([
        'user_id' => $otherUser->id,
    ]);

    $response = $this->actingAs($this->user)->get("/videos/{$video->id}");
    
    $response->assertStatus(403);
});

test('user can access crawler page', function () {
    $response = $this->actingAs($this->user)->get('/crawler');
    
    $response->assertStatus(200);
    $response->assertInertia(fn ($assert) => $assert
        ->component('crawler/index')
        ->has('videos')
        ->has('platforms')
        ->has('statuses')
    );
});

test('user can access settings page', function () {
    $response = $this->actingAs($this->user)->get('/settings');
    
    $response->assertStatus(200);
    $response->assertInertia(fn ($assert) => $assert
        ->component('settings/index')
        ->has('settings')
    );
});

test('user can update settings', function () {
    $settingsData = [
        'app_name' => 'My Custom Video Downloader',
        'app_description' => 'Custom description',
        'telegram_bot_token' => '123456789:ABCdef',
        'telegram_bot_username' => '@mybot',
        'telegram_channel_id' => '-1001234567890',
        'whitelist_enabled' => true,
        'theme' => 'dark',
        'app_logo' => '',
    ];

    $response = $this->actingAs($this->user)->patch('/settings', $settingsData);
    
    $response->assertRedirect('/settings');
    $response->assertSessionHas('success', 'Settings updated successfully!');
    
    expect(AppSetting::get('app_name'))->toBe('My Custom Video Downloader');
    expect(AppSetting::get('app_description'))->toBe('Custom description');
    expect(AppSetting::get('telegram_bot_token'))->toBe('123456789:ABCdef');
});

test('platform detection works correctly', function () {
    $testCases = [
        'https://youtube.com/watch?v=test123' => 'youtube',
        'https://youtu.be/test123' => 'youtube',
        'https://instagram.com/p/test123' => 'instagram',
        'https://twitter.com/user/status/123' => 'twitter',
        'https://x.com/user/status/123' => 'twitter',
        'https://doodstream.com/e/test123' => 'doodstream',
    ];

    foreach ($testCases as $url => $expectedPlatform) {
        $this->actingAs($this->user)->post('/crawler', ['url' => $url]);
        
        $this->assertDatabaseHas('videos', [
            'url' => $url,
            'platform' => $expectedPlatform,
        ]);
    }
});