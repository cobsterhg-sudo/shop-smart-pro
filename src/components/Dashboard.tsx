import { Card } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Users } from "lucide-react";

export const Dashboard = () => {
  // Mock data - in real app this would come from your store/API
  const stats = [
    {
      title: "Today's Sales",
      value: "₱2,450.00",
      change: "+12%",
      trend: "up",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Products in Stock",
      value: "245",
      change: "+5",
      trend: "up", 
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Low Stock Items",
      value: "8",
      change: "+2",
      trend: "down",
      icon: TrendingUp,
      color: "text-warning"
    },
    {
      title: "Transactions Today",
      value: "32",
      change: "+8",
      trend: "up",
      icon: Users,
      color: "text-accent-foreground"
    }
  ];

  const recentTransactions = [
    { id: "#001", product: "San Miguel Beer", amount: "₱140.00", time: "2:45 PM" },
    { id: "#002", product: "Lucky Me Instant Noodles", amount: "₱25.00", time: "2:30 PM" },
    { id: "#003", product: "Coca Cola 1.5L", amount: "₱45.00", time: "2:15 PM" },
    { id: "#004", product: "Bread Loaf", amount: "₱35.00", time: "1:55 PM" },
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
        {stats.map((stat, index) => {
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
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">{transaction.product}</p>
                  <p className="text-sm text-muted-foreground">{transaction.id} • {transaction.time}</p>
                </div>
                <p className="font-semibold text-foreground">{transaction.amount}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center">
              <Package className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Add Product</span>
            </button>
            <button className="p-4 rounded-lg bg-success text-success-foreground hover:bg-success/90 transition-colors text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">New Sale</span>
            </button>
            <button className="p-4 rounded-lg bg-warning text-warning-foreground hover:bg-warning/90 transition-colors text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">View Reports</span>
            </button>
            <button className="p-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-center">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Manage Users</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};