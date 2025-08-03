import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { Inventory } from "@/components/Inventory";
import { PointOfSale } from "@/components/PointOfSale";
import { SalesReports } from "@/components/SalesReports";
import { Settings } from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "inventory":
        return <Inventory />;
      case "pos":
        return <PointOfSale />;
      case "reports":
        return <SalesReports />;
      case "settings":
        return <Settings onLogout={handleLogout} />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading BentaMate...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center bg-gradient-card border-border/50 shadow-large">
          <CardHeader className="pb-6">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-primary rounded-2xl shadow-glow">
                <ShoppingCart className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
              Welcome to BentaMate
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Your modern business management solution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full h-12 bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:shadow-glow hover:scale-[1.02] transition-all duration-200"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-8 overflow-auto bg-gradient-to-br from-background via-background to-accent/5">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
