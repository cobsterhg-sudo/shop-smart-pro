import { useOnlineStatus } from '@/hooks/use-offline';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, CloudOff, Cloud } from 'lucide-react';

export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <Card className="fixed top-4 right-4 z-50 p-3 shadow-large border border-warning/50 bg-warning/10 backdrop-blur-sm animate-bounce-in">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <WifiOff className="w-4 h-4 text-warning" />
          <CloudOff className="w-4 h-4 text-warning" />
        </div>
        <div className="flex flex-col">
          <Badge variant="outline" className="text-xs text-warning border-warning/50">
            Offline Mode
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            Changes will sync when online
          </p>
        </div>
      </div>
    </Card>
  );
};