import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Download,
  Filter,
  Target,
  BarChart3,
  Clock,
  Users,
  FileText,
  X
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
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface RawTransaction {
  id: string;
  items: any[];
  total: number;
  amount_received: number;
  change_amount: number;
  created_at: string;
  user_id: string;
}

interface Product {
  id: string;
  name: string;
  capital: number;
  selling: number;
  category: string;
  stock: number;
}

interface ProcessedTransaction {
  id: string;
  items: any[];
  total: number;
  amountReceived: number;
  change: number;
  timestamp: string;
  profit: number;
  hour: number;
}

interface Analytics {
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  totalTransactions: number;
  averageTransactionValue: number;
  profitMargin: number;
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    revenue: number;
    profit: number;
    transactions: number;
  }>;
  hourlyPerformance: Array<{
    hour: number;
    transactions: number;
    revenue: number;
  }>;
  dailyTrends: Array<{
    date: string;
    revenue: number;
    profit: number;
    transactions: number;
  }>;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  category: string;
  minAmount: string;
  maxAmount: string;
}

export const SalesReports = () => {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    category: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && products.length > 0) {
      calculateAnalytics();
    }
  }, [transactions, products, timeframe]);

  const fetchData = async () => {
    try {
      // Fetch transactions and products in parallel
      const [transactionsResult, productsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (productsResult.error) throw productsResult.error;

      setProducts(productsResult.data || []);
      
      // Process transactions with profit calculations
      const processedTransactions = (transactionsResult.data || []).map((transaction: RawTransaction) => {
        const transactionDate = new Date(transaction.created_at);
        
        // Calculate actual profit for this transaction
        let transactionProfit = 0;
        if (transaction.items && Array.isArray(transaction.items)) {
          transactionProfit = transaction.items.reduce((profit, item) => {
            const product = productsResult.data?.find(p => p.id === item.id);
            if (product) {
              const itemProfit = (product.selling - product.capital) * item.quantity;
              return profit + itemProfit;
            }
            return profit;
          }, 0);
        }

        return {
          id: transaction.id,
          items: transaction.items || [],
          total: Number(transaction.total),
          amountReceived: Number(transaction.amount_received),
          change: Number(transaction.change_amount),
          timestamp: transaction.created_at,
          profit: transactionProfit,
          hour: transactionDate.getHours()
        };
      });

      setTransactions(processedTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    const now = new Date();
    let filteredTransactions = transactions;

    // Filter transactions based on timeframe
    if (timeframe === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate.getTime() === today.getTime();
      });
    } else if (timeframe === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredTransactions = transactions.filter(t => 
        new Date(t.timestamp) >= weekAgo
      );
    } else if (timeframe === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredTransactions = transactions.filter(t => 
        new Date(t.timestamp) >= monthAgo
      );
    }

    // Calculate basic metrics
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalProfit = filteredTransactions.reduce((sum, t) => sum + t.profit, 0);
    const totalCost = totalRevenue - totalProfit;
    const totalTransactions = filteredTransactions.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Calculate top selling products
    const productSales = new Map();
    filteredTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const existing = productSales.get(item.id) || {
            name: product.name,
            quantity: 0,
            revenue: 0,
            profit: 0
          };
          const itemProfit = (product.selling - product.capital) * item.quantity;
          productSales.set(item.id, {
            ...existing,
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (item.price * item.quantity),
            profit: existing.profit + itemProfit
          });
        }
      });
    });

    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate category performance
    const categoryMap = new Map();
    filteredTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const category = product.category || 'Uncategorized';
          const existing = categoryMap.get(category) || {
            category,
            revenue: 0,
            profit: 0,
            transactions: 0
          };
          const itemProfit = (product.selling - product.capital) * item.quantity;
          categoryMap.set(category, {
            ...existing,
            revenue: existing.revenue + (item.price * item.quantity),
            profit: existing.profit + itemProfit,
            transactions: existing.transactions + 1
          });
        }
      });
    });

    const categoryPerformance = Array.from(categoryMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate hourly performance
    const hourlyMap = new Map();
    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, { hour, transactions: 0, revenue: 0 });
    }

    filteredTransactions.forEach(transaction => {
      const hour = transaction.hour;
      const existing = hourlyMap.get(hour);
      hourlyMap.set(hour, {
        hour,
        transactions: existing.transactions + 1,
        revenue: existing.revenue + transaction.total
      });
    });

    const hourlyPerformance = Array.from(hourlyMap.values())
      .filter(h => h.transactions > 0);

    // Calculate daily trends (last 30 days)
    const dailyMap = new Map();
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        revenue: 0,
        profit: 0,
        transactions: 0
      });
    }

    transactions.forEach(transaction => {
      const dateStr = transaction.timestamp.split('T')[0];
      if (dailyMap.has(dateStr)) {
        const existing = dailyMap.get(dateStr);
        dailyMap.set(dateStr, {
          ...existing,
          revenue: existing.revenue + transaction.total,
          profit: existing.profit + transaction.profit,
          transactions: existing.transactions + 1
        });
      }
    });

    const dailyTrends = Array.from(dailyMap.values());

    setAnalytics({
      totalRevenue,
      totalProfit,
      totalCost,
      totalTransactions,
      averageTransactionValue,
      profitMargin,
      topSellingProducts,
      categoryPerformance,
      hourlyPerformance,
      dailyTrends
    });
  };

  const applyFilters = () => {
    let filteredTransactions = transactions;

    // Apply date filters
    if (filters.dateFrom) {
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.timestamp) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.timestamp) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Apply amount filters
    if (filters.minAmount) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.total >= parseFloat(filters.minAmount)
      );
    }
    if (filters.maxAmount) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.total <= parseFloat(filters.maxAmount)
      );
    }

    // Apply category filter
    if (filters.category) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.items.some(item => {
          const product = products.find(p => p.id === item.id);
          return product?.category === filters.category;
        })
      );
    }

    setTransactions(filteredTransactions);
    setShowFilterDialog(false);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      minAmount: '',
      maxAmount: ''
    });
    fetchData(); // Reload original data
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const csvData = [];
    
    // Add headers
    csvData.push(['Sales Report Export']);
    csvData.push(['Generated on:', new Date().toLocaleString()]);
    csvData.push(['Timeframe:', timeframe]);
    csvData.push([]);
    
    // Add summary metrics
    csvData.push(['Summary Metrics']);
    csvData.push(['Total Revenue', formatCurrency(analytics.totalRevenue)]);
    csvData.push(['Net Profit', formatCurrency(analytics.totalProfit)]);
    csvData.push(['Profit Margin', formatPercentage(analytics.profitMargin)]);
    csvData.push(['Total Transactions', analytics.totalTransactions]);
    csvData.push(['Average Transaction', formatCurrency(analytics.averageTransactionValue)]);
    csvData.push([]);

    // Add top products
    csvData.push(['Top Selling Products']);
    csvData.push(['Rank', 'Product Name', 'Quantity Sold', 'Revenue', 'Profit']);
    analytics.topSellingProducts.forEach((product, index) => {
      csvData.push([
        index + 1,
        product.name,
        product.quantity,
        formatCurrency(product.revenue),
        formatCurrency(product.profit)
      ]);
    });
    csvData.push([]);

    // Add category performance
    csvData.push(['Category Performance']);
    csvData.push(['Category', 'Revenue', 'Profit', 'Transactions']);
    analytics.categoryPerformance.forEach(category => {
      csvData.push([
        category.category,
        formatCurrency(category.revenue),
        formatCurrency(category.profit),
        category.transactions
      ]);
    });

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => `₱${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getComparisonData = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { change: Math.abs(change), isPositive: change >= 0 };
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading enhanced sales analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-muted-foreground">Calculating analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Filter Sales Data</DialogTitle>
                <DialogDescription>
                  Filter transactions by date range, category, and amount
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minAmount">Min Amount (₱)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Max Amount (₱)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      step="0.01"
                      placeholder="1000.00"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button onClick={applyFilters}>
                    <Filter className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2" onClick={exportToCSV}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
          <Button
            key={period}
            variant={timeframe === period ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeframe(period)}
            className="capitalize"
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                {timeframe} performance
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
              <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(analytics.totalProfit)}
              </p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <Target className="w-4 h-4" />
                {formatPercentage(analytics.profitMargin)} margin
              </p>
            </div>
            <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-foreground">
                {analytics.totalTransactions}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Avg: {formatCurrency(analytics.averageTransactionValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold text-foreground">
                {formatPercentage(analytics.profitMargin)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Cost: {formatCurrency(analytics.totalCost)}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-foreground rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Profit Trend */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue & Profit Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Revenue' : 'Profit']}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stackId="2"
                  stroke="hsl(var(--success))" 
                  fill="hsl(var(--success))"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Hourly Performance */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Hourly Sales Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(value) => `${value}:00`}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                  labelFormatter={(value) => `${value}:00`}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {analytics.topSellingProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(product.revenue)}</p>
                  <p className="text-sm text-success">{formatCurrency(product.profit)} profit</p>
                </div>
              </div>
            ))}
            {analytics.topSellingProducts.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No sales data available</p>
            )}
          </div>
        </Card>

        {/* Category Performance */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Category Performance</h3>
          <div className="space-y-3">
            {analytics.categoryPerformance.slice(0, 5).map((category, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{category.category}</p>
                  <p className="font-semibold text-foreground">{formatCurrency(category.revenue)}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{category.transactions} transactions</span>
                  <span className="text-success">{formatCurrency(category.profit)} profit</span>
                </div>
              </div>
            ))}
            {analytics.categoryPerformance.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No category data available</p>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Best Hour</span>
              <span className="font-medium">
                {analytics.hourlyPerformance.length > 0 
                  ? `${analytics.hourlyPerformance.reduce((best, hour) => 
                      hour.revenue > best.revenue ? hour : best
                    ).hour}:00`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Products Sold</span>
              <span className="font-medium">
                {analytics.topSellingProducts.reduce((sum, p) => sum + p.quantity, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Categories Active</span>
              <span className="font-medium">{analytics.categoryPerformance.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cost Ratio</span>
              <span className="font-medium">
                {formatPercentage(analytics.totalRevenue > 0 ? (analytics.totalCost / analytics.totalRevenue) * 100 : 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};