import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { Inventory } from "@/components/Inventory";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser("");
    setActiveTab("dashboard");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "inventory":
        return <Inventory />;
      case "pos":
        return (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>
            <p className="text-muted-foreground">POS system coming in next iteration</p>
          </div>
        );
      case "reports":
        return (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Sales Reports</h1>
            <p className="text-muted-foreground">Reporting dashboard coming in next iteration</p>
          </div>
        );
      case "settings":
        return (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <p className="text-muted-foreground">Settings panel coming in next iteration</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
