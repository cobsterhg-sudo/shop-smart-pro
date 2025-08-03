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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm ${stat.color} flex items-center gap-1 mt-1`}>
                    <TrendingUp className="w-4 h-4" />
                    {stat.change} from yesterday
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
            <span className="text-sm text-primary cursor-pointer hover:underline">View All</span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No transactions yet</div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Transaction #{transaction.id.slice(-6)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">₱{Number(transaction.total).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onTabChange("inventory")}
              className="p-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center"
            >
              <Package className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Add Product</span>
            </button>
            <button 
              onClick={() => onTabChange("pos")}
              className="p-4 rounded-lg bg-success text-success-foreground hover:bg-success/90 transition-colors text-center"
            >
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">New Sale</span>
            </button>
            <button 
              onClick={() => onTabChange("reports")}
              className="p-4 rounded-lg bg-warning text-warning-foreground hover:bg-warning/90 transition-colors text-center"
            >
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">View Reports</span>
            </button>
            <button 
              onClick={() => onTabChange("settings")}
              className="p-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-center"
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Manage Users</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};