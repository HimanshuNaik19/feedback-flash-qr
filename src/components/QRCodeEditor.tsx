
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { QRCodeContext, updateQRCode } from '@/utils/qrCodeUtils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface QRCodeEditorProps {
  qrCode: QRCodeContext;
  onSuccess: () => void;
  onCancel: () => void;
}

const QRCodeEditor = ({ qrCode, onSuccess, onCancel }: QRCodeEditorProps) => {
  const [context, setContext] = useState(qrCode.context);
  const [expiryHours, setExpiryHours] = useState(
    Math.max(
      1,
      Math.round(
        (new Date(qrCode.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60)
      )
    )
  );
  const [maxScans, setMaxScans] = useState(qrCode.maxScans);
  const [isActive, setIsActive] = useState(qrCode.isActive);
  
  const handleSave = () => {
    if (!context.trim()) {
      toast.error('Please enter a context for the QR code');
      return;
    }
    
    // Calculate new expiry date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);
    
    // Update the QR code
    const updatedQRCode = updateQRCode(qrCode.id, {
      context,
      expiresAt: expiresAt.toISOString(),
      maxScans,
      isActive
    });
    
    if (updatedQRCode) {
      onSuccess();
    } else {
      toast.error('Failed to update QR code');
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit QR Code</DialogTitle>
          <DialogDescription>
            Modify your QR code settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="context">Context (e.g., "Table 5", "Meeting Room")</Label>
            <Input 
              id="context"
              placeholder="Enter context" 
              value={context} 
              onChange={(e) => setContext(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiry">Extend Expiry by (hours): {expiryHours}</Label>
            <Slider 
              id="expiry"
              min={1} 
              max={72} 
              step={1} 
              value={[expiryHours]} 
              onValueChange={(values) => setExpiryHours(values[0])} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scans">Max Scans: {maxScans}</Label>
            <Slider 
              id="scans"
              min={qrCode.currentScans} 
              max={1000} 
              step={10} 
              value={[maxScans]} 
              onValueChange={(values) => setMaxScans(values[0])} 
            />
            <p className="text-xs text-muted-foreground">
              Current scans: {qrCode.currentScans}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="active" 
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-feedback-blue hover:bg-feedback-darkblue">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeEditor;
