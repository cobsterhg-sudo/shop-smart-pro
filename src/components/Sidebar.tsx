import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  LogOut,
  Store
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', name: 'Inventory', icon: Package },
  { id: 'pos', name: 'Point of Sale', icon: ShoppingCart },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export const Sidebar = ({ activeTab, onTabChange, onLogout }: SidebarProps) => {
  return (
    <div className="w-72 bg-[hsl(var(--sidebar-bg))] h-full flex flex-col backdrop-blur-xl border-r border-border/50 shadow-medium">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow ios-button">
            <Store className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--sidebar-text))]">BentaMate</h1>
            <p className="text-sm text-[hsl(var(--sidebar-text))]/60">Business Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-3">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full justify-start gap-4 h-14 rounded-2xl text-[hsl(var(--sidebar-text))] ios-nav-item transition-all duration-300",
                "hover:bg-[hsl(var(--sidebar-active))]/10 hover:text-[hsl(var(--sidebar-active))] hover:shadow-soft",
                isActive && "bg-[hsl(var(--sidebar-active))] hover:bg-[hsl(var(--sidebar-active))]/90 text-white shadow-glow scale-[1.02]"
              )}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-border/20">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start gap-4 h-14 rounded-2xl text-[hsl(var(--sidebar-text))] ios-nav-item transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:shadow-soft"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
};