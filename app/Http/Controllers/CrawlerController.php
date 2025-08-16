<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVideoRequest;
use App\Models\Video;
use App\Services\VideoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrawlerController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private VideoService $videoService
    ) {}

    /**
     * Display the crawler page with form and video list.
     */
    public function index(Request $request)
    {
        $query = Video::where('user_id', auth()->id())
            ->latest();

        if ($request->filled('platform')) {
            $query->where('platform', $request->platform);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $videos = $query->paginate(10);

        return Inertia::render('crawler/index', [
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
     * Store a new video crawling request.
     */
    public function store(StoreVideoRequest $request)
    {
        $video = $this->videoService->createVideoRequest(
            $request->validated(),
            auth()->user()
        );

        return redirect()->route('crawler.index')
            ->with('success', 'Video download request submitted successfully!');
    }
}