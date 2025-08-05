import { useState, useEffect } from "react";
import { useOfflineCapableOperations } from '@/hooks/use-offline';
import { offlineStorage } from '@/lib/offline-storage';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceCalculatorModal } from "./PriceCalculatorModal";
import { RetailPriceComparisonModal } from "./RetailPriceComparisonModal";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Target,
  DollarSign,
  PieChart,
  BarChart3,
  Calculator,
  Lightbulb
} from "lucide-react";
import { 
  PieChart as RechartsPie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter
} from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  category: string;
  capital: number;
  selling: number;
  stock: number;
}

interface CategoryAnalysis {
  category: string;
  products: number;
  avgMargin: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
}

interface MarginAnalysis {
  excellent: Product[];
  good: Product[];
  poor: Product[];
  negative: Product[];
}

export const CostAnalysis = () => {
  const { isOnline } = useOfflineCapableOperations();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showRetailComparison, setShowRetailComparison] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      let productsData = [];

      if (isOnline) {
        // Fetch from Supabase when online
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        productsData = data || [];

        // Cache for offline use
        await offlineStorage.cacheData('products', productsData);
      } else {
        // Load from offline cache
        const cachedProducts = await offlineStorage.getCachedData('products');
        productsData = cachedProducts || [];

        // Get offline product changes and apply them
        const offlineProducts = await offlineStorage.getUnsyncedProducts();
        offlineProducts.forEach(offlineProduct => {
          const existingIndex = productsData.findIndex(p => p.id === offlineProduct.id);
          
          if (offlineProduct.action === 'create') {
            if (existingIndex === -1) {
              productsData.unshift(offlineProduct);
            }
          } else if (offlineProduct.action === 'update') {
            if (existingIndex !== -1) {
              productsData[existingIndex] = { ...productsData[existingIndex], ...offlineProduct };
            }
          } else if (offlineProduct.action === 'delete') {
            if (existingIndex !== -1) {
              productsData.splice(existingIndex, 1);
            }
          }
        });
      }

      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall metrics
  const calculateOverallMetrics = () => {
    const totalRevenue = products.reduce((sum, p) => sum + (p.selling * p.stock), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.capital * p.stock), 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return { totalRevenue, totalCost, totalProfit, avgMargin };
  };

  // Analyze products by margin performance
  const analyzeMargins = (): MarginAnalysis => {
    const analysis: MarginAnalysis = {
      excellent: [], // >50% margin
      good: [],      // 20-50% margin
      poor: [],      // 0-20% margin
      negative: []   // negative margin
    };

    products.forEach(product => {
      const margin = product.capital > 0 ? ((product.selling - product.capital) / product.capital) * 100 : 0;
      
      if (margin < 0) {
        analysis.negative.push(product);
      } else if (margin < 20) {
        analysis.poor.push(product);
      } else if (margin < 50) {
        analysis.good.push(product);
      } else {
        analysis.excellent.push(product);
      }
    });

    return analysis;
  };

  // Category analysis
  const analyzeByCategoryData = (): CategoryAnalysis[] => {
    const categoryMap = new Map<string, CategoryAnalysis>();

    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      const profit = product.selling - product.capital;
      const margin = product.capital > 0 ? (profit / product.capital) * 100 : 0;
      const revenue = product.selling * product.stock;
      const cost = product.capital * product.stock;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          products: 0,
          avgMargin: 0,
          totalRevenue: 0,
          totalCost: 0,
          profit: 0
        });
      }

      const data = categoryMap.get(category)!;
      data.products += 1;
      data.totalRevenue += revenue;
      data.totalCost += cost;
      data.profit += profit * product.stock;
      data.avgMargin = data.totalCost > 0 ? (data.profit / data.totalCost) * 100 : 0;
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.avgMargin - a.avgMargin);
  };

  // Generate recommendations
  const generateRecommendations = () => {
    const marginAnalysis = analyzeMargins();
    const recommendations = [];

    if (marginAnalysis.negative.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Products Selling Below Cost',
        description: `${marginAnalysis.negative.length} products are losing money. Immediate price adjustment needed.`,
        products: marginAnalysis.negative.slice(0, 3)
      });
    }

    if (marginAnalysis.poor.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Low Margin Products',
        description: `${marginAnalysis.poor.length} products have margins below 20%. Consider price optimization.`,
        products: marginAnalysis.poor.slice(0, 3)
      });
    }

    if (marginAnalysis.excellent.length > 0) {
      recommendations.push({
        type: 'success',
        title: 'High Performing Products',
        description: `${marginAnalysis.excellent.length} products have excellent margins (>50%). Consider promoting these.`,
        products: marginAnalysis.excellent.slice(0, 3)
      });
    }

    return recommendations;
  };

  const overallMetrics = calculateOverallMetrics();
  const marginAnalysis = analyzeMargins();
  const categoryAnalysis = analyzeByCategoryData();
  const recommendations = generateRecommendations();

  // Chart data
  const marginDistributionData = [
    { name: 'Excellent (>50%)', value: marginAnalysis.excellent.length, fill: 'hsl(var(--success))' },
    { name: 'Good (20-50%)', value: marginAnalysis.good.length, fill: 'hsl(var(--primary))' },
    { name: 'Poor (0-20%)', value: marginAnalysis.poor.length, fill: 'hsl(var(--warning))' },
    { name: 'Negative (<0%)', value: marginAnalysis.negative.length, fill: 'hsl(var(--destructive))' }
  ].filter(item => item.value > 0);

  const scatterData = products.map(product => ({
    name: product.name,
    cost: product.capital,
    selling: product.selling,
    margin: product.capital > 0 ? ((product.selling - product.capital) / product.capital) * 100 : 0
  }));

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading cost analysis...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Cost Price Analysis</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Analyze margins, optimize pricing, and maximize profitability</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            className="bg-gradient-primary hover:opacity-90 h-10 sm:h-11"
            onClick={() => setShowCalculator(true)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Price Calculator</span>
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowRetailComparison(true)}
            className="h-10 sm:h-11"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Retail Comparison</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Margin</p>
              <p className="text-2xl font-bold text-foreground">{overallMetrics.avgMargin.toFixed(1)}%</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                Target: 30%+
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
              <p className="text-2xl font-bold text-foreground">₱{overallMetrics.totalProfit.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                From inventory value
              </p>
            </div>
            <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Margin Items</p>
              <p className="text-2xl font-bold text-foreground">{marginAnalysis.excellent.length}</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                &gt;50% margin
              </p>
            </div>
            <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center">
              <PieChart className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Problem Items</p>
              <p className="text-2xl font-bold text-foreground">{marginAnalysis.negative.length + marginAnalysis.poor.length}</p>
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="w-4 h-4" />
                Need attention
              </p>
            </div>
            <div className="w-12 h-12 bg-destructive rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin Distribution */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Margin Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie
                data={marginDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
              >
                {marginDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {marginDistributionData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.fill }}></div>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Analysis */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Category Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Avg Margin']} />
                <Bar dataKey="avgMargin" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Cost vs Selling Price Scatter */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Cost vs Selling Price Analysis</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cost" name="Cost Price" />
              <YAxis dataKey="selling" name="Selling Price" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background p-2 border rounded shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p>Cost: ₱{data.cost}</p>
                        <p>Selling: ₱{data.selling}</p>
                        <p>Margin: {data.margin.toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter dataKey="selling" fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Price Optimization Recommendations
        </h3>
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">All products have healthy margins!</p>
          ) : (
            recommendations.map((rec, index) => (
              <div key={index} className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant={rec.type === 'critical' ? 'destructive' : rec.type === 'warning' ? 'secondary' : 'default'}
                        className="capitalize"
                      >
                        {rec.type}
                      </Badge>
                      <h4 className="font-medium text-foreground">{rec.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.products.map((product, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {product.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {categoryAnalysis.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">{category.category}</p>
                <p className="text-sm text-muted-foreground">{category.products} products</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{category.avgMargin.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">avg margin</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">₱{category.profit.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">total profit</p>
              </div>
            </div>
          ))}
          {categoryAnalysis.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No categories found</p>
          )}
        </div>
      </Card>

      {/* Price Calculator Modal */}
      <PriceCalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />
      
      <RetailPriceComparisonModal
        isOpen={showRetailComparison}
        onClose={() => setShowRetailComparison(false)}
      />
    </div>
  );
};