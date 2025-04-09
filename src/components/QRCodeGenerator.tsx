
import { useState } from 'react';
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
  
  const handleGenerateQRCode = () => {
    if (!context) {
      toast.error('Please enter a context for the QR code');
      return;
    }
    
    const qrCodeData = generateQRCodeData(context, expiryHours, maxScans);
    storeQRCode(qrCodeData);
    
    // Use the deployed URL if available or fallback to current URL
    // For mobile devices, we need a fully qualified public URL
    let baseUrl;
    
    // First check if we're on a deployed Lovable domain
    if (window.location.hostname.includes('lovable.app') || 
        window.location.hostname.includes('lovableproject.com')) {
      baseUrl = window.location.origin;
    } 
    // Check if we might be on a production domain like Netlify or custom domain
    else if (!window.location.hostname.includes('localhost') && 
             !window.location.hostname.includes('127.0.0.1')) {
      baseUrl = window.location.origin;
    }
    // If we're on localhost, we need to use a public URL since QR codes scanned on mobile
    // won't be able to access localhost of a different device
    else {
      // Attempt to use the public URL of the deployed app if available
      // This is a common pattern for deployments - adjust if using a different provider
      baseUrl = 'https://feedback-flash-qr.lovable.app';
      
      // Show an informative toast that local QR codes won't work on different devices
      toast.info('Using public URL for QR code. When testing locally, scanned QR codes will only work on the same device.', {
        duration: 8000,
      });
    }
    
    const url = getQRCodeUrl(baseUrl, qrCodeData.id);
    
    console.log('Generated QR code URL:', url);
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
