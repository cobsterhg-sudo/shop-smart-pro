import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Palette, 
  Info, 
  LogOut,
  Moon,
  Sun,
  Bell,
  Shield,
  Database,
  Smartphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SettingsProps {
  onLogout: () => void;
}

export const Settings = ({ onLogout }: SettingsProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserProfile({ user, profile });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleThemeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    // In a real app, this would toggle the theme
    toast({
      title: "Theme Updated",
      description: `Switched to ${enabled ? 'dark' : 'light'} mode`,
    });
  };

  const handleNotificationChange = (enabled: boolean) => {
    setNotifications(enabled);
    toast({
      title: "Notifications Updated", 
      description: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const handleBackupChange = (enabled: boolean) => {
    setAutoBackup(enabled);
    toast({
      title: "Auto Backup Updated",
      description: `Auto backup ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const clearLocalData = () => {
    // Note: This is now a placeholder since data is stored in Supabase
    toast({
      title: "Data Management",
      description: "Data is now stored securely in Supabase cloud database",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl animate-fade-in px-1 sm:px-0">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground gradient-text">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Manage your application preferences and account</p>
      </div>

      {/* Account Section */}
      <Card className="p-4 sm:p-6 shadow-soft ios-card bg-gradient-card backdrop-blur-sm border border-border/50 animate-bounce-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Account</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 ios-button">
            <div>
              <p className="font-medium text-foreground text-sm sm:text-base">Email</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {userProfile?.user?.email || "Loading..."}
              </p>
            </div>
            <Badge variant="secondary" className="ios-button">User</Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 ios-button">
            <div>
              <p className="font-medium text-foreground text-sm sm:text-base">Account Type</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Supabase Account</p>
            </div>
            <Badge variant="outline" className="ios-button">Cloud Storage</Badge>
          </div>
          
          <Separator />
          
          <Button 
            variant="destructive" 
            onClick={onLogout}
            className="gap-2 ios-button w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm sm:text-base">Sign Out</span>
          </Button>
        </div>
      </Card>

      {/* Appearance Section */}
      <Card className="p-4 sm:p-6 shadow-soft ios-card bg-gradient-card backdrop-blur-sm border border-border/50 animate-bounce-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning rounded-xl flex items-center justify-center shadow-glow">
            <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Appearance</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 ios-button">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-warning" />}
              <div>
                <p className="font-medium text-foreground text-sm sm:text-base">Dark Mode</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Toggle between light and dark themes</p>
              </div>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={handleThemeChange}
              className="ios-button"
            />
          </div>
        </div>
      </Card>

      {/* Notifications Section */}
      <Card className="p-4 sm:p-6 shadow-soft ios-card bg-gradient-card backdrop-blur-sm border border-border/50 animate-bounce-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success rounded-xl flex items-center justify-center shadow-glow">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 ios-button">
            <div>
              <p className="font-medium text-foreground text-sm sm:text-base">Push Notifications</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Receive alerts for low stock and sales</p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={handleNotificationChange}
              className="ios-button"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 ios-button">
            <div>
              <p className="font-medium text-foreground text-sm sm:text-base">Low Stock Alerts</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Get notified when products are running low</p>
            </div>
            <Switch defaultChecked className="ios-button" />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 ios-button">
            <div>
              <p className="font-medium text-foreground text-sm sm:text-base">Daily Sales Summary</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Receive end-of-day sales reports</p>
            </div>
            <Switch defaultChecked className="ios-button" />
          </div>
        </div>
      </Card>

      {/* Data & Backup Section */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Data & Backup</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto Backup</p>
              <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
            </div>
            <Switch
              checked={autoBackup}
              onCheckedChange={handleBackupChange}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Storage Location</p>
              <p className="text-sm text-muted-foreground">Supabase Cloud Database</p>
            </div>
            <Badge variant="outline">Cloud Secure</Badge>
          </div>
          
          <Separator />
          
          <Button 
            variant="outline" 
            onClick={clearLocalData}
            size="sm"
          >
            View Data Info
          </Button>
        </div>
      </Card>

      {/* Security Section */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Security</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto Lock</p>
              <p className="text-sm text-muted-foreground">Lock app after 30 minutes of inactivity</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Require PIN for Sales</p>
              <p className="text-sm text-muted-foreground">Add extra security for transactions</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* App Information */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">App Information</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Build</span>
            <span className="font-medium">2024.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-medium">Web App</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Developer</span>
            <span className="font-medium">BentaMate Team</span>
          </div>
        </div>
      </Card>
    </div>
  );
};