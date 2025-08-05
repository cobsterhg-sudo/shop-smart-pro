import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Scan, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id?: string;
  name: string;
  barcode: string;
  capital: number;
  selling: number;
  stock: number;
  category: string;
  description?: string;
  status?: string;
}

interface ProductFormProps {
  product?: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const categories = [
  "Beverages",
  "Food & Snacks", 
  "Personal Care",
  "Household Items",
  "Electronics",
  "Clothing",
  "Other"
];

export const ProductForm = ({ product, isOpen, onClose, onSave }: ProductFormProps) => {
  const [formData, setFormData] = useState<Product>({
    name: product?.name || "",
    barcode: product?.barcode || "",
    capital: product?.capital || 0,
    selling: product?.selling || 0,
    stock: product?.stock || 0,
    category: product?.category || "",
    description: product?.description || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { toast } = useToast();

  // Handle virtual keyboard on mobile
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      // Detect keyboard by viewport height change
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;
      const threshold = screenHeight * 0.75; // Keyboard likely visible if viewport < 75% of screen
      
      setKeyboardVisible(viewportHeight < threshold);
    };

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.screen.height - window.visualViewport.height;
        setKeyboardVisible(keyboardHeight > 150); // Keyboard threshold
      }
    };

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Initial check
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', formData);
    setIsLoading(true);

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.selling <= formData.capital) {
      toast({
        title: "Validation Error", 
        description: "Selling price must be higher than capital price",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const productToSave = {
      ...formData,
      // Don't include ID for new products - let the database generate it
      ...(product?.id && { id: product.id }),
    };

    onSave(productToSave);
    
    toast({
      title: product ? "Product Updated" : "Product Added",
      description: `${formData.name} has been ${product ? 'updated' : 'added'} successfully`,
    });

    setIsLoading(false);
    onClose();
  };

  const generateBarcode = () => {
    const barcode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    setFormData({ ...formData, barcode: barcode.toString() });
    toast({
      title: "Barcode Generated",
      description: "Random barcode has been generated",
    });
  };

  const simulateScanner = () => {
    // Simulate barcode scanner
    const mockBarcodes = [
      "4806502121002",
      "4800194122306", 
      "2844711100403",
      "1234567890123"
    ];
    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
    setFormData({ ...formData, barcode: randomBarcode });
    toast({
      title: "Barcode Scanned",
      description: "Barcode captured from scanner",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`sm:max-w-[500px] animate-scale-in max-h-[90vh] overflow-hidden flex flex-col ${
          keyboardVisible ? 'fixed top-4 bottom-4 left-4 right-4 sm:relative sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto' : ''
        }`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {product ? 'Update product information' : 'Enter product details to add to inventory'}
          </DialogDescription>
        </DialogHeader>

        <div className={`flex-1 overflow-y-auto ${keyboardVisible ? 'max-h-[60vh] sm:max-h-none' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-4 p-1">{/* Added padding for better scroll */}
          {/* Product Name */}
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-card border z-50">
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Barcode */}
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Enter or scan barcode"
              />
              <Button type="button" variant="outline" onClick={simulateScanner} className="gap-1">
                <Scan className="w-4 h-4" />
                Scan
              </Button>
              <Button type="button" variant="outline" onClick={generateBarcode}>
                Generate
              </Button>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capital">Capital Price *</Label>
              <Input
                id="capital"
                type="number"
                step="0.01"
                min="0"
                value={formData.capital}
                onChange={(e) => setFormData({ ...formData, capital: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="selling">Selling Price *</Label>
              <Input
                id="selling"
                type="number"
                step="0.01"
                min="0"
                value={formData.selling}
                onChange={(e) => setFormData({ ...formData, selling: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Profit Margin Display */}
          {formData.capital > 0 && formData.selling > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Profit per unit:</span>
                <span className="font-medium text-success">₱{(formData.selling - formData.capital).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Profit margin:</span>
                <span className="font-medium text-success">
                  {formData.capital > 0 ? ((formData.selling - formData.capital) / formData.capital * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          )}

          {/* Stock */}
          <div>
            <Label htmlFor="stock">Initial Stock</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional product details..."
              rows={3}
            />
          </div>

            {/* Product Photo Section - Hide on keyboard visible to save space */}
            {!keyboardVisible && (
              <div>
                <Label>Product Photo</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload product photo</p>
                  <Button type="button" variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <DialogFooter className={`${keyboardVisible ? 'border-t bg-background/95 backdrop-blur-sm p-4' : ''}`}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-gradient-primary hover:opacity-90"
            onClick={handleSubmit}
          >
            {isLoading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};