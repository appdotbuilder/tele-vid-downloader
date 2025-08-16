import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  ExternalLink, 
  Filter, 
  Grid3X3, 
  List, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle,
  Youtube,
  Instagram,
  Twitter,
  Globe
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, VideoLink, CreateVideoLinkInput, VideoLinkFilters, PaginatedVideoLinks, Platform, LinkStatus } from '../../../server/src/schema';

interface VideoManagerProps {
  currentUser: User;
}

function VideoManager({ currentUser }: VideoManagerProps) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoLinks, setVideoLinks] = useState<VideoLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [filters, setFilters] = useState<VideoLinkFilters>({
    platform: undefined,
    status: undefined,
    limit: 20,
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [totalLinks, setTotalLinks] = useState(0);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const loadVideoLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getVideoLinks.query(filters);
      setVideoLinks(result.data);
      setTotalLinks(result.total);
    } catch (error) {
      console.error('Failed to load video links:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadVideoLinks();
  }, [loadVideoLinks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const linkData: CreateVideoLinkInput = {
        user_id: currentUser.id,
        url: url.trim()
      };
      
      const newLink = await trpc.createVideoLink.mutate(linkData);
      setVideoLinks((prev: VideoLink[]) => [newLink, ...prev]);
      setUrl('');
      setSubmitMessage({
        type: 'success',
        message: '🎉 Video link submitted successfully! Processing will start shortly.'
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSubmitMessage(null), 5000);
    } catch (error) {
      console.error('Failed to create video link:', error);
      setSubmitMessage({
        type: 'error',
        message: 'Failed to submit video link. Please check the URL and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const detectPlatform = async (url: string) => {
    try {
      const platform = await trpc.detectPlatformFromUrl.query(url);
      return platform;
    } catch (error) {
      return 'other';
    }
  };

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

  const getStatusIcon = (status: LinkStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'downloaded':
        return <Download className="w-4 h-4 text-green-500" />;
      case 'uploaded':
        return <CheckCircle2 className="w-4 h-4 text-[#0cb8b6]" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: LinkStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'downloaded':
        return 'bg-green-100 text-green-800';
      case 'uploaded':
        return 'bg-[#0cb8b6]/10 text-[#0cb8b6]';
      case 'failed':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#2e2e2e]">Video Crawler 🎬</h2>
        <p className="text-muted-foreground">
          Submit video URLs for download and upload to Telegram
        </p>
      </div>

      {/* Submit Form */}
      <Card className="border-[#0cb8b6]/20">
        <CardHeader>
          <CardTitle className="flex items-center text-[#2e2e2e]">
            <Download className="w-5 h-5 mr-2 text-[#0cb8b6]" />
            Submit Video Link
          </CardTitle>
          <CardDescription>
            Paste a video URL from YouTube, Instagram, Twitter, Doodstream, or other supported platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || !url.trim()}
                className="bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
            
            {submitMessage && (
              <Alert className={submitMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertCircle className={`h-4 w-4 ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                <AlertDescription className={submitMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {submitMessage.message}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Filters and View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
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

          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              status: value === 'all' ? undefined : value as LinkStatus,
              offset: 0 
            }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="downloaded">Downloaded</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className={viewMode === 'cards' ? 'bg-[#0cb8b6] hover:bg-[#0cb8b6]/90' : ''}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-[#0cb8b6] hover:bg-[#0cb8b6]/90' : ''}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videoLinks.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No video links yet</h3>
              <p className="text-gray-500">Submit your first video URL above to get started!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {videoLinks.map((link: VideoLink) => (
                <Card key={link.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(link.platform)}
                        <Badge variant="secondary" className="capitalize">
                          {link.platform}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(link.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(link.status)}
                          <span className="capitalize">{link.status}</span>
                        </div>
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-[#2e2e2e] mb-2 line-clamp-2">
                      {link.title || 'Processing title...'}
                    </h4>

                    <p className="text-xs text-gray-500 break-all mb-3 line-clamp-2">
                      {link.url}
                    </p>

                    {link.thumbnail_url && (
                      <div className="mb-3">
                        <img 
                          src={link.thumbnail_url} 
                          alt="Video thumbnail"
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Created: {link.created_at.toLocaleDateString()}</p>
                      {link.file_size && (
                        <p>Size: {(link.file_size / 1024 / 1024).toFixed(1)} MB</p>
                      )}
                      {link.duration && (
                        <p>Duration: {Math.floor(link.duration / 60)}:{String(link.duration % 60).padStart(2, '0')}</p>
                      )}
                    </div>

                    {link.telegram_message_link && (
                      <div className="mt-3 pt-3 border-t">
                        <Button 
                          size="sm" 
                          className="w-full bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white"
                          onClick={() => window.open(link.telegram_message_link!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Telegram
                        </Button>
                      </div>
                    )}

                    {link.error_message && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-600">{link.error_message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videoLinks.map((link: VideoLink) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(link.platform)}
                          <span className="capitalize">{link.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {link.title || 'Processing...'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {link.url}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(link.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(link.status)}
                            <span className="capitalize">{link.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {link.created_at.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {link.file_size ? `${(link.file_size / 1024 / 1024).toFixed(1)} MB` : '-'}
                      </TableCell>
                      <TableCell>
                        {link.telegram_message_link && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(link.telegram_message_link!, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Pagination */}
          {totalLinks > filters.limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, totalLinks)} of {totalLinks} links
              </p>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={filters.offset === 0}
                  onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={filters.offset + filters.limit >= totalLinks}
                  onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VideoManager;