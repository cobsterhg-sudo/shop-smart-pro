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

// Enhanced product interface
interface Product {
  id: number;
  name: string;
  barcode: string;
  capital: number;
  selling: number;
  stock: number;
  status: string;
  category: string;
  description?: string;
}

// Mock product data with categories
const initialProducts: Product[] = [
  {
    id: 1,
    name: "San Miguel Beer 330ml",
    barcode: "4806502121002",
    capital: 35.00,
    selling: 45.00,
    stock: 120,
    status: "in-stock",
    category: "Beverages"
  },
  {
    id: 2,
    name: "Lucky Me Instant Noodles",
    barcode: "4800194122306",
    capital: 18.00,
    selling: 25.00,
    stock: 5,
    status: "low-stock",
    category: "Food & Snacks"
  },
  {
    id: 3,
    name: "Coca Cola 1.5L",
    barcode: "4902777317151",
    capital: 35.00,
    selling: 45.00,
    stock: 0,
    status: "out-of-stock",
    category: "Beverages"
  },
  {
    id: 4,
    name: "Bread Loaf",
    barcode: "2844711100403",
    capital: 25.00,
    selling: 35.00,
    stock: 15,
    status: "in-stock",
    category: "Food & Snacks"
  }
];

export const Inventory = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { toast } = useToast();

  // Load products from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('bentamate_products');
    if (stored) {
      setProducts(JSON.parse(stored));
    }
  }, []);

  // Save products to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('bentamate_products', JSON.stringify(products));
  }, [products]);

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

  const handleSaveProduct = (productData: any) => {
    // Determine status based on stock
    const status = productData.stock === 0 ? "out-of-stock" : 
                   productData.stock <= 10 ? "low-stock" : "in-stock";
    
    const productWithStatus = { ...productData, status };
    
    if (editingProduct) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...productWithStatus, id: editingProduct.id } : p
      ));
    } else {
      // Add new product
      setProducts([...products, { ...productWithStatus, id: Date.now() }]);
    }
    setShowAddForm(false);
    setEditingProduct(undefined);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts(products.filter(p => p.id !== productId));
    toast({
      title: "Product Deleted",
      description: "Product has been removed from inventory",
    });
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
            {filteredProducts.map((product) => (
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
            ))}
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