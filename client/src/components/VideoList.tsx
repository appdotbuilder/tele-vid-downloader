import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  ExternalLink, 
  Search, 
  Filter, 
  Eye,
  Youtube,
  Instagram,
  Twitter,
  Globe,
  Calendar,
  Clock,
  Download as DownloadIcon
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, VideoLink, VideoLinkFilters, Platform } from '../../../server/src/schema';

interface VideoListProps {
  currentUser: User;
}

function VideoList({ currentUser }: VideoListProps) {
  const [videoLinks, setVideoLinks] = useState<VideoLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoLink | null>(null);
  const [filters, setFilters] = useState<VideoLinkFilters>({
    platform: undefined,
    status: 'uploaded', // Only show uploaded videos
    limit: 20,
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [totalVideos, setTotalVideos] = useState(0);

  const loadVideoLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getVideoLinks.query(filters);
      // Filter only uploaded videos with Telegram file IDs
      const uploadedVideos = result.data.filter((link: VideoLink) => 
        link.status === 'uploaded' && link.telegram_file_id
      );
      setVideoLinks(uploadedVideos);
      setTotalVideos(result.total);
    } catch (error) {
      console.error('Failed to load video links:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadVideoLinks();
  }, [loadVideoLinks]);

  const filteredVideos = videoLinks.filter((video: VideoLink) => {
    if (!searchQuery) return true;
    return video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           video.url.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'twitter':
        return <Twitter className="w-4 h-4 text-blue-500" />;
      default:
        return <Globe className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#2e2e2e]">Video Gallery 🎥</h2>
        <p className="text-muted-foreground">
          Browse and play your uploaded videos directly from Telegram
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select 
            value={filters.platform || 'all'} 
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              platform: value === 'all' ? undefined : value as Platform,
              offset: 0 
            }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="doodstream">Doodstream</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No videos found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search terms' : 'Upload some videos from the Crawler page to see them here!'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredVideos.map((video: VideoLink) => (
            <Card key={video.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-900">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Duration overlay */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}

                {/* Play button overlay */}
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <Button 
                        size="lg" 
                        className="bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white rounded-full w-14 h-14"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <Play className="w-6 h-6 ml-1" />
                      </Button>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        {getPlatformIcon(video.platform)}
                        <span>{video.title}</span>
                      </DialogTitle>
                      <DialogDescription>
                        Playing from Telegram • {video.platform}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                      {/* Note: In a real implementation, you would use Telegram's Bot API to get the actual video file */}
                      <div className="text-center text-white">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-60" />
                        <p className="text-lg mb-2">Video Player</p>
                        <p className="text-sm opacity-80 mb-4">
                          This would display the video using Telegram's file_id: {video.telegram_file_id}
                        </p>
                        <Button 
                          className="bg-[#0cb8b6] hover:bg-[#0cb8b6]/90"
                          onClick={() => window.open(video.telegram_message_link!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Telegram
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Video Info */}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(video.platform)}
                    <Badge variant="secondary" className="text-xs capitalize">
                      {video.platform}
                    </Badge>
                  </div>
                  {video.telegram_message_link && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(video.telegram_message_link!, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <h3 className="font-semibold text-[#2e2e2e] mb-2 line-clamp-2 text-sm leading-tight">
                  {video.title || 'Untitled Video'}
                </h3>

                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{video.created_at.toLocaleDateString()}</span>
                  </div>
                  
                  {video.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                  )}
                  
                  {video.file_size && (
                    <div className="flex items-center space-x-1">
                      <DownloadIcon className="w-3 h-3" />
                      <span>{formatFileSize(video.file_size)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="w-full bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Play Video
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalVideos > filters.limit && (
        <div className="flex items-center justify-center space-x-4 pt-8">
          <Button 
            variant="outline" 
            disabled={filters.offset === 0}
            onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(totalVideos / filters.limit)}
          </span>
          <Button 
            variant="outline" 
            disabled={filters.offset + filters.limit >= totalVideos}
            onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#2e2e2e]">Video Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#0cb8b6]">{totalVideos}</div>
              <div className="text-sm text-gray-500">Total Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#0cb8b6]">
                {videoLinks.filter(v => v.platform === 'youtube').length}
              </div>
              <div className="text-sm text-gray-500">YouTube</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#0cb8b6]">
                {videoLinks.filter(v => v.platform === 'instagram').length}
              </div>
              <div className="text-sm text-gray-500">Instagram</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#0cb8b6]">
                {videoLinks.filter(v => ['twitter', 'doodstream', 'other'].includes(v.platform)).length}
              </div>
              <div className="text-sm text-gray-500">Other</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VideoList;