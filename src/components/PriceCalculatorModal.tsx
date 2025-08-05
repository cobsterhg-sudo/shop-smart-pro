import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calculator, TrendingUp, Target, DollarSign } from "lucide-react";

interface PriceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PriceCalculatorModal = ({ isOpen, onClose }: PriceCalculatorModalProps) => {
  const [costPrice, setCostPrice] = useState("");
  const [targetMargin, setTargetMargin] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [calculationMode, setCalculationMode] = useState<'margin' | 'selling'>('margin');

  const calculateFromMargin = () => {
    const cost = parseFloat(costPrice);
    const margin = parseFloat(targetMargin);
    
    if (cost > 0 && margin >= 0) {
      const selling = cost * (1 + margin / 100);
      setSellingPrice(selling.toFixed(2));
    }
  };

  const calculateMargin = () => {
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    
    if (cost > 0 && selling > 0) {
      const margin = ((selling - cost) / cost) * 100;
      setTargetMargin(margin.toFixed(1));
    }
  };

  const reset = () => {
    setCostPrice("");
    setTargetMargin("");
    setSellingPrice("");
  };

  const cost = parseFloat(costPrice) || 0;
  const selling = parseFloat(sellingPrice) || 0;
  const margin = cost > 0 && selling > 0 ? ((selling - cost) / cost) * 100 : 0;
  const profit = selling - cost;

  const getMarginColor = (margin: number) => {
    if (margin < 0) return "text-destructive";
    if (margin < 20) return "text-warning";
    if (margin < 50) return "text-primary";
    return "text-success";
  };

  const getMarginLabel = (margin: number) => {
    if (margin < 0) return "Loss";
    if (margin < 20) return "Low";
    if (margin < 50) return "Good";
    return "Excellent";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Price Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate optimal selling prices and profit margins for your products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={calculationMode === 'margin' ? 'default' : 'outline'}
              onClick={() => setCalculationMode('margin')}
              className="flex-1"
            >
              Calculate Selling Price
            </Button>
            <Button
              variant={calculationMode === 'selling' ? 'default' : 'outline'}
              onClick={() => setCalculationMode('selling')}
              className="flex-1"
            >
              Calculate Margin
            </Button>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Cost Price *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {calculationMode === 'margin' ? (
              <div>
                <Label htmlFor="margin">Target Margin % *</Label>
                <div className="flex gap-2">
                  <Input
                    id="margin"
                    type="number"
                    step="0.1"
                    min="0"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(e.target.value)}
                    placeholder="0.0"
                  />
                  <Button 
                    type="button" 
                    onClick={calculateFromMargin}
                    disabled={!costPrice || !targetMargin}
                  >
                    Calculate
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="selling">Selling Price *</Label>
                <div className="flex gap-2">
                  <Input
                    id="selling"
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                  />
                  <Button 
                    type="button" 
                    onClick={calculateMargin}
                    disabled={!costPrice || !sellingPrice}
                  >
                    Calculate
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {cost > 0 && selling > 0 && (
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-3 text-foreground">Calculation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profit per Unit</p>
                    <p className="font-semibold text-foreground">₱{profit.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Margin</p>
                    <p className={`font-semibold ${getMarginColor(margin)}`}>
                      {margin.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className={`font-semibold ${getMarginColor(margin)}`}>
                      {getMarginLabel(margin)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Margin Targets */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-foreground">Quick Margin Targets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[20, 30, 50, 100].map((targetPercent) => (
                <Button
                  key={targetPercent}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTargetMargin(targetPercent.toString());
                    setCalculationMode('margin');
                    if (costPrice) {
                      const cost = parseFloat(costPrice);
                      const selling = cost * (1 + targetPercent / 100);
                      setSellingPrice(selling.toFixed(2));
                    }
                  }}
                  disabled={!costPrice}
                >
                  {targetPercent}%
                </Button>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};