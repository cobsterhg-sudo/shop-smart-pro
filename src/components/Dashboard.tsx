import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

export const Dashboard = ({ onTabChange }: DashboardProps) => {
  const [stats, setStats] = useState({
    todaysSales: 0,
    productsInStock: 0,
    lowStockItems: 0,
    transactionsToday: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch today's transactions
      const today = new Date().toISOString().split('T')[0];
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', today);

      // Calculate today's sales
      const todaysSales = transactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0;
      const transactionsToday = transactions?.length || 0;

      // Fetch products for stock stats
      const { data: products } = await supabase
        .from('products')
        .select('stock, status');

      const productsInStock = products?.filter(p => p.stock > 10).length || 0;
      const lowStockItems = products?.filter(p => p.stock > 0 && p.stock <= 10).length || 0;

      // Get recent transactions with product details
      const { data: recentTransactionsData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      setStats({
        todaysSales,
        productsInStock,
        lowStockItems,
        transactionsToday
      });

      setRecentTransactions(recentTransactionsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    {
      title: "Today's Sales",
      value: `₱${stats.todaysSales.toFixed(2)}`,
      change: "+12%",
      trend: "up",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Products in Stock",
      value: stats.productsInStock.toString(),
      change: "+5",
      trend: "up", 
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: "+2",
      trend: "down",
      icon: TrendingUp,
      color: "text-warning"
    },
    {
      title: "Transactions Today",
      value: stats.transactionsToday.toString(),
      change: "+8",
      trend: "up",
      icon: Users,
      color: "text-accent-foreground"
    }
  ];


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Overview of your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="p-4 sm:p-6 bg-gradient-card shadow-soft ios-card rounded-3xl border-0 backdrop-blur-sm"
              style={{
                animationDelay: `${index * 150}ms`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm ${stat.color} flex items-center gap-2 font-medium`}>
                    <TrendingUp className="w-4 h-4" />
                    {stat.change} from yesterday
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow ios-button">
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Recent Transactions */}
        <Card className="p-4 sm:p-8 shadow-soft ios-card rounded-3xl border-0 backdrop-blur-sm bg-gradient-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Recent Transactions</h3>
            <button 
              onClick={() => onTabChange("reports")}
              className="text-sm text-primary cursor-pointer hover:underline font-semibold ios-button px-3 py-1 rounded-full hover:bg-primary/10 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
            ) : (
              recentTransactions.map((transaction, index) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 ios-card"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div>
                    <p className="font-semibold text-foreground">Transaction #{transaction.id.slice(-6)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-foreground text-lg">₱{Number(transaction.total).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 sm:p-8 shadow-soft ios-card rounded-3xl border-0 backdrop-blur-sm bg-gradient-card">
          <h3 className="text-xl font-bold text-foreground mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onTabChange("inventory")}
              className="p-6 rounded-2xl bg-primary text-primary-foreground shadow-glow ios-button flex flex-col items-center space-y-3 group"
            >
              <Package className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold">Add Product</span>
            </button>
            <button 
              onClick={() => onTabChange("pos")}
              className="p-6 rounded-2xl bg-success text-success-foreground shadow-glow ios-button flex flex-col items-center space-y-3 group"
            >
              <DollarSign className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold">New Sale</span>
            </button>
            <button 
              onClick={() => onTabChange("reports")}
              className="p-6 rounded-2xl bg-warning text-warning-foreground shadow-glow ios-button flex flex-col items-center space-y-3 group"
            >
              <TrendingUp className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold">View Reports</span>
            </button>
            <button 
              onClick={() => onTabChange("settings")}
              className="p-6 rounded-2xl bg-accent text-accent-foreground shadow-glow ios-button flex flex-col items-center space-y-3 group"
            >
              <Users className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold">Manage Users</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};