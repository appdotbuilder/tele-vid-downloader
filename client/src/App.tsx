import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, BarChart3, Download, Settings, Video, Users, Bot, Shield } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, VideoLink, TelegramBot, StatsResponse } from '../../server/src/schema';

// Import components
import Dashboard from '@/components/Dashboard';
import VideoManager from '@/components/VideoManager';
import SettingsPanel from '@/components/SettingsPanel';
import VideoList from '@/components/VideoList';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if user is logged in (mock for now since we need Telegram OAuth)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real implementation, this would check for auth token
        // For now, we'll create a mock user
        const mockUser: User = {
          id: 1,
          telegram_id: "123456789",
          username: "demo_user",
          first_name: "Demo",
          last_name: "User",
          avatar_url: null,
          is_admin: true,
          created_at: new Date(),
          updated_at: new Date()
        };
        setCurrentUser(mockUser);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    // In real app, clear auth tokens
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0cb8b6] mx-auto"></div>
          <p className="mt-4 text-[#2e2e2e]">Loading...</p>
        </div>
      </div>
    );
  }

  // Guest Home Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-8">
            <div className="w-24 h-24 bg-[#0cb8b6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#2e2e2e] mb-2">Video Downloader</h1>
            <p className="text-gray-600 mb-8">
              Download videos from YouTube, Instagram, Twitter, and more platforms. 
              Upload directly to Telegram for easy access.
            </p>
          </div>

          <Card className="border-[#0cb8b6]/20">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Sign in with your Telegram account to get started
              </p>
              <Button className="w-full bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white">
                <Bot className="w-4 h-4 mr-2" />
                Login with Telegram
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 text-xs text-gray-500">
            <p>🎥 Multi-platform support</p>
            <p>📱 Direct Telegram integration</p>
            <p>☁️ No storage limits</p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-[#0cb8b6] rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#2e2e2e]">Video Downloader</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar_url || undefined} />
                <AvatarFallback className="bg-[#0cb8b6] text-white">
                  {currentUser.first_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium text-[#2e2e2e]">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
                <p className="text-gray-500">@{currentUser.username}</p>
              </div>
              {currentUser.is_admin && (
                <Badge variant="secondary" className="bg-[#0cb8b6]/10 text-[#0cb8b6]">
                  Admin
                </Badge>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-gray-600">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent">
                <TabsTrigger 
                  value="dashboard" 
                  className="w-full justify-start data-[state=active]:bg-[#0cb8b6]/10 data-[state=active]:text-[#0cb8b6]"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="crawler" 
                  className="w-full justify-start data-[state=active]:bg-[#0cb8b6]/10 data-[state=active]:text-[#0cb8b6]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Crawler
                </TabsTrigger>
                <TabsTrigger 
                  value="videos" 
                  className="w-full justify-start data-[state=active]:bg-[#0cb8b6]/10 data-[state=active]:text-[#0cb8b6]"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="w-full justify-start data-[state=active]:bg-[#0cb8b6]/10 data-[state=active]:text-[#0cb8b6]"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} className="space-y-4">
            <TabsContent value="dashboard" className="space-y-4">
              <Dashboard currentUser={currentUser} />
            </TabsContent>

            <TabsContent value="crawler" className="space-y-4">
              <VideoManager currentUser={currentUser} />
            </TabsContent>

            <TabsContent value="videos" className="space-y-4">
              <VideoList currentUser={currentUser} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <SettingsPanel currentUser={currentUser} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

export default App;