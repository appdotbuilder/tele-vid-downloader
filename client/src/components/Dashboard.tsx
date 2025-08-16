import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, Download, Link, Activity } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, StatsResponse, DashboardStats } from '../../../server/src/schema';

interface DashboardProps {
  currentUser: User;
}

function Dashboard({ currentUser }: DashboardProps) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const statsParams: DashboardStats = {
        period,
        days: 30
      };
      const result = await trpc.getDashboardStats.query(statsParams);
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const platformColors: Record<string, string> = {
    youtube: 'bg-red-500',
    instagram: 'bg-pink-500',
    twitter: 'bg-blue-500',
    doodstream: 'bg-purple-500',
    other: 'bg-gray-500'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    downloaded: 'bg-green-500',
    uploaded: 'bg-[#0cb8b6]',
    failed: 'bg-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2e2e2e]">
            Welcome back, {currentUser.first_name}! 👋
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your video downloads today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={period === 'daily' ? 'default' : 'secondary'}
            className={period === 'daily' ? 'bg-[#0cb8b6] hover:bg-[#0cb8b6]/90' : ''}
            onClick={() => setPeriod('daily')}
          >
            Daily
          </Badge>
          <Badge 
            variant={period === 'weekly' ? 'default' : 'secondary'}
            className={period === 'weekly' ? 'bg-[#0cb8b6] hover:bg-[#0cb8b6]/90' : ''}
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </Badge>
          <Badge 
            variant={period === 'monthly' ? 'default' : 'secondary'}
            className={period === 'monthly' ? 'bg-[#0cb8b6] hover:bg-[#0cb8b6]/90' : ''}
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#0cb8b6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link className="h-4 w-4 text-[#0cb8b6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2e2e2e]">
              {stats?.total_links.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total video links submitted
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#0cb8b6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-[#0cb8b6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2e2e2e]">
              {stats?.total_users.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#0cb8b6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#0cb8b6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2e2e2e]">
              {stats ? Math.round(((stats.links_by_status.uploaded || 0) / stats.total_links) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully uploaded
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#0cb8b6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Links</CardTitle>
            <Activity className="h-4 w-4 text-[#0cb8b6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2e2e2e]">
              {stats?.daily_stats[stats.daily_stats.length - 1]?.links_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Links submitted today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Platform Distribution */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-[#2e2e2e]">Platform Distribution</CardTitle>
            <CardDescription>
              Video links by platform over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              {stats && Object.entries(stats.links_by_platform).map(([platform, count]) => {
                const percentage = stats.total_links > 0 ? (count / stats.total_links) * 100 : 0;
                return (
                  <div key={platform} className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${platformColors[platform] || 'bg-gray-500'}`}></div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{platform}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${platformColors[platform] || 'bg-gray-500'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-[#2e2e2e]">Status Overview</CardTitle>
            <CardDescription>
              Current status of all video links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats && Object.entries(stats.links_by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status] || 'bg-gray-500'}`}></div>
                    <span className="text-sm font-medium capitalize">{status}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#2e2e2e]">Recent Activity</CardTitle>
          <CardDescription>
            Daily statistics for the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-7">
            {stats?.daily_stats.slice(-7).map((day, index) => (
              <div key={day.date} className="text-center">
                <div className="text-2xl font-bold text-[#0cb8b6] mb-1">
                  {day.links_count}
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  Links
                </div>
                <div className="text-xs font-medium text-[#2e2e2e]">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {day.users_count} users
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;