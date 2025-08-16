import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Bot, 
  Shield, 
  Palette, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle,
  Users,
  Upload,
  AlertCircle,
  Save,
  Moon,
  Sun
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  TelegramBot, 
  CreateTelegramBotInput, 
  AppSettings, 
  Whitelist, 
  CreateWhitelistInput,
  BotPlatform,
  Platform,
  CreateBotPlatformInput
} from '../../../server/src/schema';

interface SettingsPanelProps {
  currentUser: User;
}

function SettingsPanel({ currentUser }: SettingsPanelProps) {
  const [telegramBots, setTelegramBots] = useState<TelegramBot[]>([]);
  const [whitelist, setWhitelist] = useState<Whitelist[]>([]);
  const [botPlatforms, setBotPlatforms] = useState<BotPlatform[]>([]);
  const [appSettings, setAppSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bots');

  // Bot form states
  const [botForm, setBotForm] = useState<CreateTelegramBotInput>({
    name: '',
    token: '',
    username: null,
    is_default: false,
    is_active: true
  });
  const [isAddingBot, setIsAddingBot] = useState(false);

  // Whitelist form states
  const [whitelistTelegramId, setWhitelistTelegramId] = useState('');
  const [isAddingToWhitelist, setIsAddingToWhitelist] = useState(false);

  // Settings states
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyName, setCompanyName] = useState('Video Downloader');
  const [allowPublicAccess, setAllowPublicAccess] = useState(true);

  // Messages
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load all data in parallel
      const [botsResult, whitelistResult, platformsResult, settingsResult] = await Promise.all([
        trpc.getTelegramBots.query(),
        trpc.getWhitelist.query(),
        trpc.getBotPlatformAssignments.query(),
        trpc.getAppSettings.query()
      ]);

      setTelegramBots(botsResult);
      setWhitelist(whitelistResult);
      setBotPlatforms(platformsResult);
      
      // Convert settings array to object
      const settingsObj = settingsResult.reduce((acc: Record<string, string>, setting: AppSettings) => {
        acc[setting.key] = setting.value || '';
        return acc;
      }, {});
      setAppSettings(settingsObj);
      
      // Set local states from settings
      setIsDarkMode(settingsObj.theme === 'dark');
      setCompanyLogo(settingsObj.company_logo || '');
      setCompanyName(settingsObj.company_name || 'Video Downloader');
      setAllowPublicAccess(settingsObj.allow_public_access !== 'false');
      
    } catch (error) {
      console.error('Failed to load settings data:', error);
      showMessage('error', 'Failed to load settings data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBot(true);
    
    try {
      const newBot = await trpc.createTelegramBot.mutate(botForm);
      setTelegramBots((prev: TelegramBot[]) => [...prev, newBot]);
      setBotForm({
        name: '',
        token: '',
        username: null,
        is_default: false,
        is_active: true
      });
      showMessage('success', 'Telegram bot added successfully!');
    } catch (error) {
      console.error('Failed to create bot:', error);
      showMessage('error', 'Failed to add telegram bot');
    } finally {
      setIsAddingBot(false);
    }
  };

  const handleAddToWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whitelistTelegramId.trim()) return;
    
    setIsAddingToWhitelist(true);
    
    try {
      const whitelistData: CreateWhitelistInput = {
        telegram_id: whitelistTelegramId.trim(),
        added_by_user_id: currentUser.id
      };
      
      await trpc.addToWhitelist.mutate(whitelistData);
      
      // Reload whitelist
      const updatedWhitelist = await trpc.getWhitelist.query();
      setWhitelist(updatedWhitelist);
      
      setWhitelistTelegramId('');
      showMessage('success', 'User added to whitelist successfully!');
    } catch (error) {
      console.error('Failed to add to whitelist:', error);
      showMessage('error', 'Failed to add user to whitelist');
    } finally {
      setIsAddingToWhitelist(false);
    }
  };

  const handleRemoveFromWhitelist = async (telegramId: string) => {
    try {
      await trpc.removeFromWhitelist.mutate(telegramId);
      setWhitelist((prev: Whitelist[]) => prev.filter((item: Whitelist) => item.telegram_id !== telegramId));
      showMessage('success', 'User removed from whitelist');
    } catch (error) {
      console.error('Failed to remove from whitelist:', error);
      showMessage('error', 'Failed to remove user from whitelist');
    }
  };

  const handleAssignBotToPlatform = async (botId: number, platform: Platform) => {
    try {
      const assignmentData: CreateBotPlatformInput = {
        bot_id: botId,
        platform
      };
      
      await trpc.assignBotToPlatform.mutate(assignmentData);
      
      // Reload platform assignments
      const updatedAssignments = await trpc.getBotPlatformAssignments.query();
      setBotPlatforms(updatedAssignments);
      
      showMessage('success', `Bot assigned to ${platform} successfully!`);
    } catch (error) {
      console.error('Failed to assign bot to platform:', error);
      showMessage('error', 'Failed to assign bot to platform');
    }
  };

  const handleRemoveBotFromPlatform = async (botId: number, platform: Platform) => {
    try {
      await trpc.removeBotFromPlatform.mutate({ botId, platform });
      
      // Reload platform assignments
      const updatedAssignments = await trpc.getBotPlatformAssignments.query();
      setBotPlatforms(updatedAssignments);
      
      showMessage('success', `Bot removed from ${platform} successfully!`);
    } catch (error) {
      console.error('Failed to remove bot from platform:', error);
      showMessage('error', 'Failed to remove bot from platform');
    }
  };

  const handleUpdateSettings = async (key: string, value: string) => {
    try {
      await trpc.updateAppSettings.mutate({ key, value });
      setAppSettings(prev => ({ ...prev, [key]: value }));
      showMessage('success', 'Settings updated successfully!');
    } catch (error) {
      console.error('Failed to update settings:', error);
      showMessage('error', 'Failed to update settings');
    }
  };

  const getBotForPlatform = (platform: Platform) => {
    const assignment = botPlatforms.find((bp: BotPlatform) => bp.platform === platform);
    if (!assignment) return null;
    return telegramBots.find((bot: TelegramBot) => bot.id === assignment.bot_id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#2e2e2e]">Settings ⚙️</h2>
        <p className="text-muted-foreground">
          Configure your video downloader application
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertCircle className={`h-4 w-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bots" className="data-[state=active]:bg-[#0cb8b6] data-[state=active]:text-white">
            <Bot className="w-4 h-4 mr-2" />
            Telegram Bots
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="data-[state=active]:bg-[#0cb8b6] data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Whitelist
          </TabsTrigger>
          <TabsTrigger value="platform" className="data-[state=active]:bg-[#0cb8b6] data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Platform Bots
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-[#0cb8b6] data-[state=active]:text-white">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Telegram Bots Tab */}
        <TabsContent value="bots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-[#2e2e2e]">
                <Bot className="w-5 h-5 mr-2 text-[#0cb8b6]" />
                Telegram Bots Management
              </CardTitle>
              <CardDescription>
                Configure Telegram bots for uploading videos. You can have multiple bots for different platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Bot Form */}
              <form onSubmit={handleAddBot} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold text-[#2e2e2e]">Add New Bot</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="bot-name">Bot Name</Label>
                    <Input
                      id="bot-name"
                      placeholder="YouTube Bot"
                      value={botForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBotForm(prev => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bot-username">Bot Username (optional)</Label>
                    <Input
                      id="bot-username"
                      placeholder="@your_bot"
                      value={botForm.username || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBotForm(prev => ({ ...prev, username: e.target.value || null }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bot-token">Bot Token</Label>
                    <Input
                      id="bot-token"
                      type="password"
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={botForm.token}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBotForm(prev => ({ ...prev, token: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="bot-default"
                      checked={botForm.is_default}
                      onCheckedChange={(checked) =>
                        setBotForm(prev => ({ ...prev, is_default: checked }))
                      }
                    />
                    <Label htmlFor="bot-default">Default Bot</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="bot-active"
                      checked={botForm.is_active}
                      onCheckedChange={(checked) =>
                        setBotForm(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                    <Label htmlFor="bot-active">Active</Label>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isAddingBot}
                  className="bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white"
                >
                  {isAddingBot ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Bot
                    </>
                  )}
                </Button>
              </form>

              {/* Bots List */}
              <div className="space-y-3">
                {telegramBots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No Telegram bots configured yet</p>
                  </div>
                ) : (
                  telegramBots.map((bot: TelegramBot) => (
                    <div key={bot.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${bot.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <h4 className="font-medium text-[#2e2e2e]">{bot.name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            {bot.username && <span>@{bot.username}</span>}
                            {bot.is_default && (
                              <Badge className="bg-[#0cb8b6]/10 text-[#0cb8b6]">Default</Badge>
                            )}
                            <span>•</span>
                            <span>{bot.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Whitelist Tab */}
        <TabsContent value="whitelist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-[#2e2e2e]">
                <Shield className="w-5 h-5 mr-2 text-[#0cb8b6]" />
                User Whitelist
              </CardTitle>
              <CardDescription>
                Control who can access your video downloader by managing a whitelist of Telegram IDs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Public Access Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <h4 className="font-medium text-[#2e2e2e]">Allow Public Access</h4>
                  <p className="text-sm text-gray-500">When enabled, anyone can login. When disabled, only whitelisted users can access.</p>
                </div>
                <Switch
                  checked={allowPublicAccess}
                  onCheckedChange={(checked) => {
                    setAllowPublicAccess(checked);
                    handleUpdateSettings('allow_public_access', checked.toString());
                  }}
                />
              </div>

              {/* Add to Whitelist Form */}
              {!allowPublicAccess && (
                <form onSubmit={handleAddToWhitelist} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-[#2e2e2e]">Add User to Whitelist</h4>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Telegram ID (e.g., 123456789)"
                      value={whitelistTelegramId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhitelistTelegramId(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button 
                      type="submit" 
                      disabled={isAddingToWhitelist}
                      className="bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white"
                    >
                      {isAddingToWhitelist ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Whitelist */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#2e2e2e] flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Whitelisted Users ({whitelist.length})
                </h4>
                {whitelist.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No users in whitelist</p>
                    {allowPublicAccess && <p className="text-xs">Public access is enabled</p>}
                  </div>
                ) : (
                  whitelist.map((item: Whitelist) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{item.telegram_id}</span>
                        <p className="text-xs text-gray-500">
                          Added on {item.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveFromWhitelist(item.telegram_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Bots Tab */}
        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-[#2e2e2e]">
                <Settings className="w-5 h-5 mr-2 text-[#0cb8b6]" />
                Platform Bot Assignments
              </CardTitle>
              <CardDescription>
                Assign specific bots to different platforms for better organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['youtube', 'instagram', 'twitter', 'doodstream', 'other'] as Platform[]).map((platform) => {
                const assignedBot = getBotForPlatform(platform);
                return (
                  <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium capitalize">{platform[0]}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-[#2e2e2e] capitalize">{platform}</h4>
                        {assignedBot ? (
                          <p className="text-sm text-gray-500">Assigned to: {assignedBot.name}</p>
                        ) : (
                          <p className="text-sm text-gray-500">Using default bot</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={assignedBot?.id.toString() || 'default'}
                        onValueChange={(value) => {
                          if (value === 'default' && assignedBot) {
                            handleRemoveBotFromPlatform(assignedBot.id, platform);
                          } else if (value !== 'default') {
                            handleAssignBotToPlatform(parseInt(value), platform);
                          }
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select bot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Use Default Bot</SelectItem>
                          {telegramBots.filter((bot: TelegramBot) => bot.is_active).map((bot: TelegramBot) => (
                            <SelectItem key={bot.id} value={bot.id.toString()}>
                              {bot.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-[#2e2e2e]">
                <Palette className="w-5 h-5 mr-2 text-[#0cb8b6]" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <div>
                    <h4 className="font-medium text-[#2e2e2e]">Theme</h4>
                    <p className="text-sm text-gray-500">
                      {isDarkMode ? 'Dark mode is enabled' : 'Light mode is enabled'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={(checked) => {
                    setIsDarkMode(checked);
                    handleUpdateSettings('theme', checked ? 'dark' : 'light');
                  }}
                />
              </div>

              {/* Company Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                      placeholder="Video Downloader"
                    />
                    <Button
                      onClick={() => handleUpdateSettings('company_name', companyName)}
                      className="bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="company-logo">Company Logo URL</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="company-logo"
                      value={companyLogo}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyLogo(e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <Button
                      onClick={() => handleUpdateSettings('company_logo', companyLogo)}
                      className="bg-[#0cb8b6] hover:bg-[#0cb8b6]/90 text-white"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                  {companyLogo && (
                    <div className="mt-2">
                      <img 
                        src={companyLogo} 
                        alt="Company logo preview" 
                        className="w-16 h-16 object-contain border rounded"
                        onError={() => showMessage('error', 'Invalid logo URL')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Color Scheme Info */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-[#2e2e2e] mb-2">Color Scheme</h4>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-[#0cb8b6] rounded"></div>
                    <span className="text-sm">Primary (#0cb8b6)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-[#2e2e2e] rounded"></div>
                    <span className="text-sm">Text (#2e2e2e)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-white border rounded"></div>
                    <span className="text-sm">Background (#ffffff)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsPanel;