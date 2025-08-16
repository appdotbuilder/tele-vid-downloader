<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVideoRequest;
use App\Models\Video;
use App\Services\VideoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VideoController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private VideoService $videoService
    ) {}

    /**
     * Display a listing of videos.
     */
    public function index(Request $request)
    {
        $query = Video::with('user')
            ->where('user_id', auth()->id())
            ->latest();

        if ($request->filled('platform')) {
            $query->where('platform', $request->platform);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $videos = $query->paginate(12);

        return Inertia::render('videos/index', [
            'videos' => $videos,
            'filters' => [
                'platform' => $request->platform,
                'status' => $request->status,
            ],
            'platforms' => ['youtube', 'instagram', 'twitter', 'doodstream'],
            'statuses' => ['pending', 'processing', 'completed', 'failed'],
        ]);
    }

    /**
     * Store a newly created video request.
     */
    public function store(StoreVideoRequest $request)
    {
        $video = $this->videoService->createVideoRequest(
            $request->validated(),
            auth()->user()
        );

        return redirect()->route('videos.index')
            ->with('success', 'Video download request submitted successfully!');
    }

    /**
     * Display the specified video.
     */
    public function show(Video $video)
    {
        // Ensure user can only view their own videos
        if ($video->user_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('videos/show', [
            'video' => $video->load('user'),
        ]);
    }

    /**
     * Remove the specified video.
     */
    public function destroy(Video $video)
    {
        // Ensure user can only delete their own videos
        if ($video->user_id !== auth()->id()) {
            abort(403);
        }

        $this->videoService->deleteVideo($video);

        return redirect()->route('videos.index')
            ->with('success', 'Video deleted successfully!');
    }
}