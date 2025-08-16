<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Video;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with statistics.
     */
    public function index()
    {
        $user = auth()->user();
        
        // Get user's video statistics
        $userStats = [
            'total_videos' => $user->videos()->count(),
            'completed_videos' => $user->videos()->where('status', 'completed')->count(),
            'processing_videos' => $user->videos()->where('status', 'processing')->count(),
            'failed_videos' => $user->videos()->where('status', 'failed')->count(),
        ];

        // Get platform statistics for user
        $platformStats = Video::where('user_id', $user->id)
            ->selectRaw('platform, count(*) as count')
            ->groupBy('platform')
            ->pluck('count', 'platform')
            ->toArray();

        // Get daily submissions for the last 7 days
        $dailyStats = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $count = $user->videos()
                ->whereDate('created_at', $date)
                ->count();
            $dailyStats[] = [
                'date' => $date->format('M d'),
                'count' => $count,
            ];
        }

        // Get recent videos
        $recentVideos = $user->videos()
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => $userStats,
            'platformStats' => $platformStats,
            'dailyStats' => $dailyStats,
            'recentVideos' => $recentVideos,
        ]);
    }
}