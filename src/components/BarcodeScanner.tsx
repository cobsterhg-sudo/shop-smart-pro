import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Camera, AlertCircle } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScanner = ({ isOpen, onClose, onScan }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      setError(null);
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera access and try again.');
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      // Initialize the code reader
      codeReader.current = new BrowserMultiFormatReader();

      // Start scanning
      const result = await codeReader.current.decodeOnceFromVideoDevice(
        undefined, // Use default camera
        videoRef.current
      );

      if (result) {
        const barcode = result.getText();
        toast({
          title: "Barcode Scanned!",
          description: `Found: ${barcode}`,
        });
        onScan(barcode);
        onClose();
      }
    } catch (err: any) {
      console.error('Scanning error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access and try again.');
        setHasPermission(false);
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Barcode scanning is not supported on this device.');
      } else {
        setError('Failed to scan barcode. Please try again.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
      codeReader.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      setError(null);
      stream.getTracks().forEach(track => track.stop());
      toast({
        title: "Camera Access Granted",
        description: "You can now scan barcodes!",
      });
    } catch (err) {
      console.error('Camera permission request failed:', err);
      setError('Failed to get camera access. Please check your browser settings.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Barcode Scanner
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-4 top-4 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-muted rounded-lg object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                <div className="w-48 h-48 border-2 border-primary rounded-lg flex items-center justify-center">
                  <div className="text-primary font-medium">Scanning...</div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Camera Permission */}
          {hasPermission === false && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Camera access is required to scan barcodes.
              </p>
              <Button onClick={requestCameraAccess} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Grant Camera Access
              </Button>
            </div>
          )}

          {/* Scan Controls */}
          {hasPermission && (
            <div className="flex gap-2">
              <Button
                onClick={startScanning}
                disabled={isScanning}
                className="flex-1"
              >
                {isScanning ? "Scanning..." : "Start Scanning"}
              </Button>
              <Button
                variant="outline"
                onClick={stopScanning}
                disabled={!isScanning}
              >
                Stop
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Position the barcode within the camera view</p>
            <p>The scanner will automatically detect and read the code</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};