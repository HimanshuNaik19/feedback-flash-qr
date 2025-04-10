
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { generateQRCodeData, storeQRCode, getQRCodeUrl } from '@/utils/qrCodeUtils';
import QRCodeDisplay from './QRCodeDisplay';
import { toast } from 'sonner';
import { Copy, Share2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const QRCodeGenerator = () => {
  const [context, setContext] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxScans, setMaxScans] = useState(100);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string>('');
  const urlInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Determine the deployment URL
    const currentUrl = window.location.origin;
    setDeployedUrl(currentUrl);
    
    console.log('Current deployment URL detected:', currentUrl);
    console.log('User agent:', navigator.userAgent);
    console.log('Is mobile detected:', isMobile);
  }, [isMobile]);
  
  const handleGenerateQRCode = () => {
    if (!context) {
      toast.error('Please enter a context for the QR code');
      return;
    }
    
    const qrCodeData = generateQRCodeData(context, expiryHours, maxScans);
    storeQRCode(qrCodeData);
    
    // Use the detected deployment URL for the QR code
    const url = getQRCodeUrl(deployedUrl, qrCodeData.id);
    
    console.log('Generated QR code with absolute URL:', url);
    setQrCodeUrl(url);
    setGeneratedQRCode(JSON.stringify(qrCodeData));
    toast.success('QR Code generated successfully!');
  };
  
  const copyToClipboard = () => {
    if (!qrCodeUrl) return;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(qrCodeUrl)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(err => {
          console.error('Failed to copy:', err);
          toast.error('Failed to copy link');
        });
    } else {
      // Fallback for browsers without clipboard API
      if (urlInputRef.current) {
        urlInputRef.current.select();
        document.execCommand('copy');
        toast.success('Link copied to clipboard!');
      }
    }
  };
  
  const shareUrl = () => {
    if (!qrCodeUrl) return;
    
    if (navigator.share) {
      navigator.share({
        title: `Feedback for ${context}`,
        text: 'Please scan this QR code to provide feedback',
        url: qrCodeUrl,
      })
      .then(() => console.log('Shared successfully'))
      .catch(err => console.error('Share failed:', err));
    } else {
      copyToClipboard();
    }
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
            
            <div className="mt-4">
              <Label htmlFor="qr-url" className="text-sm">Feedback URL</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  id="qr-url"
                  ref={urlInputRef}
                  value={qrCodeUrl} 
                  readOnly 
                  className="text-xs flex-1"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy link">
                  <Copy className="h-4 w-4" />
                </Button>
                {navigator.share && (
                  <Button variant="outline" size="icon" onClick={shareUrl} title="Share link">
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This QR code is generated for: {deployedUrl}
                <br />
                {isMobile ? (
                  <>
                    Mobile device detected. You can share this link directly or copy it to send to others.
                  </>
                ) : (
                  <>
                    If scanning with a mobile device, make sure the URL is accessible from that device.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          className="w-full bg-feedback-blue hover:bg-feedback-darkblue" 
          onClick={handleGenerateQRCode}
        >
          Generate QR Code
        </Button>
        
        {generatedQRCode && qrCodeUrl && (
          <div className="w-full">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={copyToClipboard}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Feedback Link
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default QRCodeGenerator;
