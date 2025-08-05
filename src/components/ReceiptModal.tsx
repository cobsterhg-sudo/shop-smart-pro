import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Receipt, Download, Printer } from "lucide-react";

interface ReceiptData {
  id: number | string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  amountReceived?: number;
  amount_received?: number;
  change?: number;
  change_amount?: number;
  timestamp: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal = ({ receipt, isOpen, onClose }: ReceiptModalProps) => {
  if (!receipt) return null;

  // Helper functions to safely get values with fallbacks
  const getAmountReceived = () => receipt.amountReceived ?? receipt.amount_received ?? 0;
  const getChange = () => receipt.change ?? receipt.change_amount ?? 0;
  const getTotal = () => receipt.total ?? 0;

  const printReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const newWindow = window.open('', '', 'width=400,height=600');
      newWindow?.document.write(`
        <html>
          <head>
            <title>Receipt #${receipt.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total-row { border-top: 2px solid #000; padding-top: 10px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      newWindow?.document.close();
      newWindow?.print();
    }
  };

  const downloadReceipt = () => {
    const receiptText = `
BENTAMATE RECEIPT
Transaction #${receipt.id}
${new Date(receipt.timestamp).toLocaleString()}
================================

${receipt.items?.map(item => 
  `${item?.name || 'Unknown Item'}\n${item?.quantity || 0}x ₱${(item?.price || 0).toFixed(2)} = ₱${((item?.quantity || 0) * (item?.price || 0)).toFixed(2)}`
).join('\n\n')}

================================
TOTAL: ₱${getTotal().toFixed(2)}
RECEIVED: ₱${getAmountReceived().toFixed(2)}
CHANGE: ₱${getChange().toFixed(2)}

Thank you for your business!
`;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Receipt #{receipt.id}
          </DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="receipt max-w-sm mx-auto">
          <div className="header text-center border-b-2 border-black pb-4 mb-4">
            <h2 className="text-xl font-bold">BENTAMATE</h2>
            <p className="text-sm">Business Manager</p>
            <p className="text-xs mt-2">Transaction #{receipt.id}</p>
            <p className="text-xs">{new Date(receipt.timestamp).toLocaleString()}</p>
          </div>

          <div className="items space-y-2 mb-4">
            {receipt.items?.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <span className="font-medium">{item?.name || 'Unknown Item'}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{item?.quantity || 0}x ₱{(item?.price || 0).toFixed(2)}</span>
                  <span>₱{((item?.quantity || 0) * (item?.price || 0)).toFixed(2)}</span>
                </div>
              </div>
            )) || []}
          </div>

          <Separator className="my-4" />

          <div className="totals space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span>₱{getTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>RECEIVED:</span>
              <span>₱{getAmountReceived().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>CHANGE:</span>
              <span>₱{getChange().toFixed(2)}</span>
            </div>
          </div>

          <div className="footer text-center mt-6 text-xs text-muted-foreground">
            <p>Thank you for your business!</p>
            <p>Please come again</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={printReceipt} className="flex-1 gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" onClick={downloadReceipt} className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};