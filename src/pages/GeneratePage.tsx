
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, WifiOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSynchronizationStatus } from '@/utils/firebase/networkStatus';

const GeneratePage = () => {
  const isMobile = useIsMobile();
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'syncing' | 'checking'>('checking');
  
  // Check network status on page load
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const status = await getSynchronizationStatus();
        setNetworkStatus(status);
      } catch (error) {
        console.error('Error checking network status:', error);
        setNetworkStatus('offline');
      }
    };
    
    checkNetwork();
    
    // Set up network status listener
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Periodic check
    const interval = setInterval(checkNetwork, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-heading">Generate QR Code</h1>
          <p className="text-muted-foreground">Create customized QR codes for feedback collection</p>
        </div>
        
        {/* Network Status Indicator */}
        {networkStatus === 'offline' && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex gap-2 items-start">
                <WifiOff className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  <strong>Offline Mode:</strong> You appear to be offline. QR codes will be saved locally and will sync when you're back online.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isMobile && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Mobile Device Detected:</strong> For best results, please generate QR codes on the deployed site, 
                  not in development mode. After generating, use the share or copy button to share the link directly with others.
                  <br /><br />
                  <strong>Important:</strong> QR codes scanned from the same device might not work correctly due to browser storage limitations.
                  It's recommended to scan the QR code from a different device than the one that generated it.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-center py-8">
          <QRCodeGenerator />
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
          <h2 className="text-xl font-semibold mb-4">How to Use QR Codes</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Generate a QR code with a specific context (e.g., "Table 5")</li>
            <li>The QR code will be valid for the specified time and number of scans</li>
            <li>Share the QR code by displaying it, printing it, or sending the direct link</li>
            <li>When someone scans the code, they'll be taken to a feedback form</li>
            <li>The feedback will be associated with the context you provided</li>
          </ol>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-4">
          <h2 className="text-lg font-semibold mb-2">Cross-Device Compatibility</h2>
          <p className="mb-4">
            To ensure your QR codes work correctly on all devices:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Share the direct link</strong> - For mobile users, share the feedback link directly instead of having them scan a QR code</li>
            <li><strong>Use different devices</strong> - Don't scan your own QR codes from the same device that created them</li>
            <li><strong>Verify on production</strong> - Always test your QR codes on the deployed site, not localhost</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default GeneratePage;
