import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: number;
  items: any[];
  total: number;
  amountReceived: number;
  change: number;
  timestamp: string;
}

export const SalesReports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected format
      const transformedData = data?.map(transaction => ({
        id: parseInt(transaction.id.slice(-6)),
        items: transaction.items as any[],
        total: Number(transaction.total),
        amountReceived: Number(transaction.amount_received),
        change: Number(transaction.change_amount),
        timestamp: transaction.created_at
      })) || [];

      setTransactions(transformedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const today = new Date();
  const todayTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.timestamp);
    return transactionDate.toDateString() === today.toDateString();
  });

  const totalSales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = todayTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Generate chart data
  const generateChartData = () => {
    const data = [];
    const now = new Date();
    
    if (timeframe === 'daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.timestamp);
          return transactionDate.toDateString() === date.toDateString();
        });
        
        data.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          sales: dayTransactions.reduce((sum, t) => sum + t.total, 0),
          transactions: dayTransactions.length
        });
      }
    }
    
    return data;
  };

  const chartData = generateChartData();

  // Top selling products
  const getTopProducts = () => {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.price * item.quantity;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const topProducts = getTopProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
          <p className="text-muted-foreground">Track your business performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "Loading..." : `₱${totalSales.toFixed(2)}`}
              </p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                +12% from yesterday
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "Loading..." : totalTransactions}
              </p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                +8 from yesterday
              </p>
            </div>
            <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Sale</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "Loading..." : `₱${averageTransaction.toFixed(2)}`}
              </p>
              <p className="text-sm text-warning flex items-center gap-1 mt-1">
                <TrendingDown className="w-4 h-4" />
                -2% from yesterday
              </p>
            </div>
            <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold text-foreground">32%</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                +5% from yesterday
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-foreground rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Sales Trend</h3>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <Button
                  key={period}
                  variant={timeframe === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe(period)}
                  className="capitalize"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₱${value}`, 'Sales']} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Transaction Volume Chart */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Transaction Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transactions" fill="hsl(var(--success))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No sales data available</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">₱{product.revenue.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">#{transaction.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className="font-semibold text-foreground">₱{transaction.total.toFixed(2)}</p>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No transactions yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};