import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Target,
  ShoppingCart
} from "lucide-react";

interface RetailPriceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Standard retail pricing multipliers by category
const retailMultipliers = {
  'food-beverage': {
    name: 'Food & Beverage',
    discount: 1.5,
    convenience: 2.0,
    supermarket: 1.8,
    premium: 2.5
  },
  'personal-care': {
    name: 'Personal Care',
    discount: 1.8,
    convenience: 2.5,
    supermarket: 2.2,
    premium: 3.0
  },
  'household': {
    name: 'Household Items',
    discount: 1.6,
    convenience: 2.2,
    supermarket: 2.0,
    premium: 2.8
  },
  'electronics': {
    name: 'Electronics',
    discount: 1.3,
    convenience: 1.8,
    supermarket: 1.6,
    premium: 2.2
  },
  'clothing': {
    name: 'Clothing',
    discount: 2.0,
    convenience: 3.0,
    supermarket: 2.5,
    premium: 4.0
  },
  'pharmacy': {
    name: 'Pharmacy',
    discount: 1.4,
    convenience: 2.0,
    supermarket: 1.7,
    premium: 2.3
  },
  'general': {
    name: 'General Merchandise',
    discount: 1.7,
    convenience: 2.3,
    supermarket: 2.0,
    premium: 2.9
  }
};

export const RetailPriceComparisonModal = ({ isOpen, onClose }: RetailPriceComparisonModalProps) => {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [myPrice, setMyPrice] = useState("");
  const [category, setCategory] = useState("general");
  const [comparisons, setComparisons] = useState<any>(null);

  const calculateComparisons = () => {
    const cost = parseFloat(costPrice);
    const mySellingPrice = parseFloat(myPrice);
    
    if (cost > 0 && mySellingPrice > 0) {
      const multipliers = retailMultipliers[category as keyof typeof retailMultipliers];
      
      const standardPrices = {
        discount: cost * multipliers.discount,
        convenience: cost * multipliers.convenience,
        supermarket: cost * multipliers.supermarket,
        premium: cost * multipliers.premium
      };

      const myMargin = ((mySellingPrice - cost) / cost) * 100;
      
      const comparisonsData = {
        myPrice: mySellingPrice,
        myMargin,
        standardPrices,
        differences: {
          discount: ((mySellingPrice - standardPrices.discount) / standardPrices.discount) * 100,
          convenience: ((mySellingPrice - standardPrices.convenience) / standardPrices.convenience) * 100,
          supermarket: ((mySellingPrice - standardPrices.supermarket) / standardPrices.supermarket) * 100,
          premium: ((mySellingPrice - standardPrices.premium) / standardPrices.premium) * 100
        },
        recommendations: generateRecommendations(mySellingPrice, standardPrices, myMargin)
      };
      
      setComparisons(comparisonsData);
    }
  };

  const generateRecommendations = (myPrice: number, standardPrices: any, myMargin: number) => {
    const recommendations = [];
    
    if (myPrice < standardPrices.discount) {
      recommendations.push({
        type: 'warning',
        message: 'Your price is below discount store levels. Consider increasing for better profitability.'
      });
    } else if (myPrice > standardPrices.premium) {
      recommendations.push({
        type: 'warning',
        message: 'Your price is above premium retail levels. This might reduce competitiveness.'
      });
    } else if (myPrice >= standardPrices.convenience && myPrice <= standardPrices.premium) {
      recommendations.push({
        type: 'success',
        message: 'Your pricing is in the optimal range for convenience stores.'
      });
    }
    
    if (myMargin < 30) {
      recommendations.push({
        type: 'info',
        message: 'Consider increasing margin to at least 30% for sustainable profitability.'
      });
    }
    
    return recommendations;
  };

  const getPriceComparisonIcon = (difference: number) => {
    if (difference > 5) return <TrendingUp className="w-4 h-4 text-success" />;
    if (difference < -5) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getPriceComparisonColor = (difference: number) => {
    if (difference > 5) return "text-success";
    if (difference < -5) return "text-destructive";
    return "text-muted-foreground";
  };

  useEffect(() => {
    if (costPrice && myPrice) {
      calculateComparisons();
    } else {
      setComparisons(null);
    }
  }, [costPrice, myPrice, category]);

  const reset = () => {
    setProductName("");
    setProductType("");
    setCostPrice("");
    setMyPrice("");
    setCategory("general");
    setComparisons(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:max-w-[700px] sm:h-auto sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6 animate-scale-in">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Price Comparison
          </DialogTitle>
          <DialogDescription className="text-sm">
            Compare your pricing against retail standards
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Product Information */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="product-name" className="text-sm font-medium">Product Name</Label>
              <Input
                id="product-name"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Coca Cola 1.5L"
                className="h-11 text-base"
              />
            </div>

            <div>
              <Label htmlFor="product-type" className="text-sm font-medium">Product Type/Brand</Label>
              <Input
                id="product-type"
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="e.g., Soft Drink, Shampoo, etc."
                className="h-11 text-base"
              />
            </div>
          </div>

          {/* Pricing Information */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="cost" className="text-sm font-medium">Cost Price *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="h-11 text-base"
              />
            </div>

            <div>
              <Label htmlFor="my-price" className="text-sm font-medium">My Selling Price *</Label>
              <Input
                id="my-price"
                type="number"
                step="0.01"
                min="0"
                value={myPrice}
                onChange={(e) => setMyPrice(e.target.value)}
                placeholder="0.00"
                className="h-11 text-base"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium">Product Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(retailMultipliers).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comparison Results */}
          {comparisons && (
            <>
              {/* Product Information Display */}
              {(productName || productType) && (
                <Card className="p-4 bg-muted/30">
                  <h3 className="font-semibold mb-2 text-foreground">Product Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Product Name</p>
                        <p className="font-medium text-foreground">{productName}</p>
                      </div>
                    )}
                    {productType && (
                      <div>
                        <p className="text-sm text-muted-foreground">Product Type</p>
                        <p className="font-medium text-foreground">{productType}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* My Current Pricing */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Your Current Pricing
                </h3>
                 <div className="grid grid-cols-1 gap-3 sm:gap-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                       <DollarSign className="w-5 h-5 text-white" />
                     </div>
                     <div>
                       <p className="text-sm text-muted-foreground">Selling Price</p>
                       <p className="font-semibold text-lg text-foreground">₱{comparisons.myPrice.toFixed(2)}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                       <TrendingUp className="w-5 h-5 text-white" />
                     </div>
                     <div>
                       <p className="text-sm text-muted-foreground">Your Margin</p>
                       <p className="font-semibold text-lg text-success">{comparisons.myMargin.toFixed(1)}%</p>
                     </div>
                   </div>
                 </div>
              </Card>

              {/* Retail Store Comparisons */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  Standard Retail Pricing
                </h3>
                 <div className="grid grid-cols-1 gap-3 sm:gap-4">
                   {Object.entries(comparisons.standardPrices).map(([storeType, price]) => (
                     <div key={storeType} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                       <div>
                         <p className="font-medium text-foreground capitalize text-sm">
                           {storeType.replace(/([A-Z])/g, ' $1').trim()} Store
                         </p>
                         <p className="text-lg font-bold text-foreground">₱{(price as number).toFixed(2)}</p>
                       </div>
                       <div className="flex items-center gap-2">
                         {getPriceComparisonIcon(comparisons.differences[storeType])}
                         <span className={`text-sm font-medium ${getPriceComparisonColor(comparisons.differences[storeType])}`}>
                           {comparisons.differences[storeType] > 0 ? '+' : ''}
                           {comparisons.differences[storeType].toFixed(1)}%
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
              </Card>

              {/* Recommendations */}
              {comparisons.recommendations.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-foreground">Pricing Recommendations</h3>
                  <div className="space-y-2">
                    {comparisons.recommendations.map((rec: any, index: number) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          rec.type === 'success' ? 'bg-success/10 border-success' :
                          rec.type === 'warning' ? 'bg-warning/10 border-warning' :
                          'bg-primary/10 border-primary'
                        }`}
                      >
                        <p className="text-sm text-foreground">{rec.message}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Legend */}
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-2 text-foreground">Store Type Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><strong>Discount:</strong> Budget-focused stores</div>
              <div><strong>Supermarket:</strong> Standard retail chains</div>
              <div><strong>Convenience:</strong> Local corner stores</div>
              <div><strong>Premium:</strong> High-end retail outlets</div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={reset} className="h-11 px-6 text-base">
              Reset
            </Button>
            <Button variant="outline" onClick={onClose} className="h-11 px-6 text-base">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};