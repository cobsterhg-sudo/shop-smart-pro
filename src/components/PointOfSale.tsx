import { useState, useEffect } from "react";
import { ReceiptModal } from "./ReceiptModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Receipt,
  Scan
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  barcode: string;
  selling: number;
  stock: number;
}

export const PointOfSale = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountReceived, setAmountReceived] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, barcode, selling, stock')
        .gt('stock', 0)
        .eq('status', 'in-stock');

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm) ||
    product.id.includes(searchTerm)
  );

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.selling,
        quantity: 1
      }]);
    }
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`,
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setAmountReceived("");
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // Add tax calculations here if needed
  const change = amountReceived ? Math.max(0, parseFloat(amountReceived) - total) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    if (!amountReceived || parseFloat(amountReceived) < total) {
      toast({
        title: "Insufficient Payment",
        description: "Amount received must be equal to or greater than total",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to complete the sale",
          variant: "destructive",
        });
        return;
      }

      // Save transaction to Supabase
      const transactionData = {
        items: cart as any, // Cast to any to satisfy Json type
        total,
        amount_received: parseFloat(amountReceived),
        change_amount: change,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;

      // Update product stock
      for (const item of cart) {
        const product = availableProducts.find(p => p.id === item.id);
        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.id);
        }
      }

      setLastTransaction({
        ...data,
        amountReceived: parseFloat(amountReceived),
        timestamp: data.created_at
      });
      setShowReceipt(true);

      toast({
        title: "Sale Complete!",
        description: `Transaction completed. Change: ₱${change.toFixed(2)}`,
      });

      clearCart();
      fetchProducts(); // Refresh products to update stock
    } catch (error) {
      console.error('Error completing sale:', error);
      toast({
        title: "Error",
        description: "Failed to complete sale",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full px-1 sm:px-0">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Point of Sale</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Scan or search products to add to cart</p>
        </div>

        {/* Search Bar */}
        <Card className="p-3 sm:p-4 shadow-soft rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 sm:h-12 rounded-xl sm:rounded-2xl"
              />
            </div>
            <Button variant="outline" className="gap-2 h-10 sm:h-12 px-3 sm:px-4 rounded-xl sm:rounded-2xl">
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          </div>
        </Card>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {searchTerm ? "No products match your search" : "No products available"}
            </div>
          ) : (
            filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="p-2 sm:p-4 shadow-soft hover:shadow-medium transition-all cursor-pointer rounded-lg sm:rounded-2xl"
              onClick={() => addToCart(product)}
            >
              <div className="space-y-1 sm:space-y-3">
                <div className="w-full h-12 sm:h-20 bg-gradient-primary rounded-md flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-h-0">
                  <h3 className="font-medium text-foreground text-xs sm:text-sm leading-tight line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-muted-foreground hidden sm:block">Stock: {product.stock}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm sm:text-base font-bold text-foreground">₱{product.selling.toFixed(2)}</span>
                  <Badge variant="outline" className="text-xs w-fit">
                    #{product.id.slice(-6)}
                  </Badge>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      </div>

      {/* Cart Section */}
      <Card className="p-4 sm:p-6 shadow-soft h-fit rounded-2xl sm:rounded-3xl">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Cart</h2>
            <Badge variant="secondary">{cart.length} items</Badge>
          </div>

          {/* Cart Items */}
          <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₱{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 sm:w-7 sm:h-7 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 sm:w-8 text-center text-xs sm:text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 sm:w-7 sm:h-7 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="w-6 h-6 sm:w-7 sm:h-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <label className="text-xs sm:text-sm font-medium">Amount Received</label>
              <Input
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="mt-1 h-10 sm:h-12 rounded-xl sm:rounded-2xl"
              />
            </div>
            
            {amountReceived && (
              <div className="flex justify-between text-sm">
                <span>Change:</span>
                <span className="font-medium">₱{change.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={handleCheckout}
              className="w-full bg-gradient-primary hover:opacity-90 h-10 sm:h-12 rounded-xl sm:rounded-2xl"
              disabled={cart.length === 0}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Complete Sale</span>
            </Button>
            
            {cart.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearCart}
                className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl"
              >
                <span className="text-sm sm:text-base">Clear Cart</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={lastTransaction}
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  );
};