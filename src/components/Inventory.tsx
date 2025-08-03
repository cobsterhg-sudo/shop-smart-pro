import { useState, useEffect } from "react";
import { ProductForm } from "./ProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Enhanced product interface
interface Product {
  id: string;
  name: string;
  barcode: string;
  capital: number;
  selling: number;
  stock: number;
  status: string;
  category: string;
  description?: string;
}

export const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load products from Supabase on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string, stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Out of Stock</Badge>;
    } else if (stock <= 10) {
      return <Badge variant="secondary" className="gap-1 bg-warning text-warning-foreground"><AlertTriangle className="w-3 h-3" />Low Stock</Badge>;
    } else {
      return <Badge variant="default" className="gap-1 bg-success text-success-foreground"><CheckCircle className="w-3 h-3" />In Stock</Badge>;
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowAddForm(true);
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      // Determine status based on stock
      const status = productData.stock === 0 ? "out-of-stock" : 
                     productData.stock <= 10 ? "low-stock" : "in-stock";
      
      const productWithStatus = { 
        ...productData, 
        status,
        capital: Number(productData.capital),
        selling: Number(productData.selling),
        stock: Number(productData.stock)
      };
      
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productWithStatus)
          .eq('id', editingProduct.id);

        if (error) throw error;

        setProducts(products.map(p => 
          p.id === editingProduct.id ? { ...productWithStatus, id: editingProduct.id } : p
        ));
        
        toast({
          title: "Product Updated",
          description: "Product has been updated successfully",
        });
      } else {
        // Add new product
        const { data, error } = await supabase
          .from('products')
          .insert(productWithStatus)
          .select()
          .single();

        if (error) throw error;

        setProducts([data, ...products]);
        
        toast({
          title: "Product Added",
          description: "Product has been added successfully",
        });
      }
      
      setShowAddForm(false);
      setEditingProduct(undefined);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Product Deleted",
        description: "Product has been removed from inventory",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your product catalog and stock levels</p>
        </div>
        <Button 
          onClick={handleAddProduct}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent border-none outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Button>
        </div>
      </Card>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">In Stock</p>
              <p className="text-2xl font-bold text-foreground">
                {products.filter(p => p.stock > 10).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-foreground">
                {products.filter(p => p.stock > 0 && p.stock <= 10).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-foreground">
                {products.filter(p => p.stock === 0).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="shadow-soft">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Product Catalog</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterCategory !== "all" ? "No products match your filters" : "No products added yet"}
              </div>
            ) : (
              filteredProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-medium transition-all duration-200">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{product.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Barcode: {product.barcode}</span>
                        {product.category && (
                          <span className="px-2 py-1 bg-accent rounded text-xs">{product.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 items-center text-center min-w-0 flex-1">
                  <div>
                    <p className="text-sm text-muted-foreground">Capital</p>
                    <p className="font-semibold text-foreground">₱{product.capital.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Selling Price</p>
                    <p className="font-semibold text-foreground">₱{product.selling.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock</p>
                    <p className="font-semibold text-foreground">{product.stock}</p>
                  </div>
                  <div>
                    {getStatusBadge(product.status, product.stock)}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProduct(product)}
                    className="hover-scale"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground hover-scale"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Product Form Modal */}
      <ProductForm
        product={editingProduct}
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingProduct(undefined);
        }}
        onSave={handleSaveProduct}
      />
    </div>
  );
};