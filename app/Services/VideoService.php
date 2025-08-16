<?php

namespace App\Services;

use App\Models\User;
use App\Models\Video;
use Illuminate\Support\Str;

class VideoService
{
    /**
     * Create a new video download request.
     */
    public function createVideoRequest(array $data, User $user): Video
    {
        $platform = $this->detectPlatform($data['url']);
        
        return Video::create([
            'user_id' => $user->id,
            'url' => $data['url'],
            'platform' => $platform,
            'status' => 'pending',
        ]);
    }

    /**
     * Detect the platform from the URL.
     */
    public function detectPlatform(string $url): string
    {
        if (Str::contains($url, ['youtube.com', 'youtu.be'])) {
            return 'youtube';
        }
        
        if (Str::contains($url, 'instagram.com')) {
            return 'instagram';
        }
        
        if (Str::contains($url, ['twitter.com', 'x.com'])) {
            return 'twitter';
        }
        
        if (Str::contains($url, 'doodstream.com')) {
            return 'doodstream';
        }
        
        return 'unknown';
    }

    /**
     * Delete a video and its associated files.
     */
    public function deleteVideo(Video $video): void
    {
        // Delete the actual file if it exists
        if ($video->file_path && file_exists(storage_path('app/' . $video->file_path))) {
            unlink(storage_path('app/' . $video->file_path));
        }
        
        $video->delete();
    }

    /**
     * Get video statistics for dashboard.
     */
    public function getStatistics(): array
    {
        return [
            'total_videos' => Video::count(),
            'completed_videos' => Video::where('status', 'completed')->count(),
            'processing_videos' => Video::where('status', 'processing')->count(),
            'failed_videos' => Video::where('status', 'failed')->count(),
            'platform_stats' => Video::selectRaw('platform, count(*) as count')
                ->groupBy('platform')
                ->pluck('count', 'platform')
                ->toArray(),
        ];
    }
}