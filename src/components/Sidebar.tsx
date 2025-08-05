import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  LogOut,
  Store,
  TrendingUp
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
  { id: 'cost-analysis', name: 'Cost Analysis', icon: TrendingUp },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export const Sidebar = ({ activeTab, onTabChange, onLogout }: SidebarProps) => {
  return (
    <div className="w-full lg:w-72 bg-gradient-card backdrop-blur-xl h-20 lg:h-full flex lg:flex-col border-r border-border/30 shadow-medium">
      {/* Logo/Brand - Hidden on mobile */}
      <div className="hidden lg:block p-6 border-b border-border/20">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow ios-button">
            <Store className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">BentaMate</h1>
            <p className="text-sm text-muted-foreground">Business Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 lg:p-6 p-2 lg:space-y-2 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 lg:gap-0 scrollbar-hide items-center lg:items-stretch">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "lg:w-full min-w-[65px] lg:min-w-0 flex-shrink-0 lg:justify-start justify-center gap-1 lg:gap-4 h-16 lg:h-12 rounded-xl lg:rounded-2xl text-foreground ios-nav-item transition-all duration-300 flex-col lg:flex-row px-2 lg:px-4 animate-scale-in",
                "hover:bg-primary/10 hover:text-primary hover:shadow-soft hover:scale-[1.02]",
                isActive && "bg-gradient-primary hover:bg-gradient-primary text-white shadow-glow scale-[1.02] border border-primary/20"
              )}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="font-medium text-[9px] lg:text-sm leading-tight text-center">{item.name}</span>
            </Button>
          );
        })}
        
        {/* Logout button inline on mobile */}
        <Button
          variant="ghost"
          onClick={onLogout}
          className="lg:hidden min-w-[60px] flex-shrink-0 justify-center gap-1 h-16 rounded-xl text-foreground ios-nav-item transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:shadow-soft flex-col px-2 animate-scale-in"
          style={{ animationDelay: `${navigation.length * 50}ms` }}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-[9px] leading-tight text-center">Logout</span>
        </Button>
      </nav>

      {/* Logout - Desktop only */}
      <div className="hidden lg:block lg:p-6 lg:border-t border-border/20">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start gap-4 h-12 rounded-2xl text-foreground ios-nav-item transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:shadow-soft flex-row animate-scale-in"
          style={{ animationDelay: `${(navigation.length + 1) * 50}ms` }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </Button>
      </div>
    </div>
  );
};