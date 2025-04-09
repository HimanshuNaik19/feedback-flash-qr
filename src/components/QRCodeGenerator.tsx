
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { generateQRCodeData, storeQRCode, getQRCodeUrl } from '@/utils/qrCodeUtils';
import QRCodeDisplay from './QRCodeDisplay';
import { toast } from 'sonner';

const QRCodeGenerator = () => {
  const [context, setContext] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxScans, setMaxScans] = useState(100);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string>('');
  
  useEffect(() => {
    // Determine the deployment URL
    const currentUrl = window.location.origin;
    setDeployedUrl(currentUrl);
    
    console.log('Current deployment URL detected:', currentUrl);
  }, []);
  
  const handleGenerateQRCode = () => {
    if (!context) {
      toast.error('Please enter a context for the QR code');
      return;
    }
    
    const qrCodeData = generateQRCodeData(context, expiryHours, maxScans);
    storeQRCode(qrCodeData);
    
    // Use the detected deployment URL for the QR code
    // This ensures it will work on the same device where it's generated
    const url = getQRCodeUrl(deployedUrl, qrCodeData.id);
    
    console.log('Generated QR code with absolute URL:', url);
    setQrCodeUrl(url);
    setGeneratedQRCode(JSON.stringify(qrCodeData));
    toast.success('QR Code generated successfully!');
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold gradient-heading">Generate QR Code</CardTitle>
        <CardDescription>Create a custom QR code for collecting feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Label htmlFor="expiry">Expiry (hours): {expiryHours}</Label>
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
            min={1} 
            max={1000} 
            step={10} 
            value={[maxScans]} 
            onValueChange={(values) => setMaxScans(values[0])} 
          />
        </div>
        
        {generatedQRCode && qrCodeUrl && (
          <div className="mt-4 animate-fade-in">
            <QRCodeDisplay value={qrCodeUrl} size={200} />
            <p className="text-sm text-center mt-2 text-muted-foreground break-all">
              {qrCodeUrl}
            </p>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This QR code is generated for: {deployedUrl}
                <br />
                If you access this from a different device, make sure you're using the same URL.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-feedback-blue hover:bg-feedback-darkblue" 
          onClick={handleGenerateQRCode}
        >
          Generate QR Code
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QRCodeGenerator;
