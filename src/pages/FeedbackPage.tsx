
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQRCode, isQRCodeValid, incrementScan } from '@/utils/qrCodeUtils';
import FeedbackForm from '@/components/FeedbackForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FeedbackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [retries, setRetries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Enhanced logging for debugging
    console.log('FeedbackPage mounted', { 
      id, 
      retries,
      localStorage: Object.keys(localStorage),
      url: window.location.href,
      userAgent: navigator.userAgent,
      isMobile: /Mobi|Android/i.test(navigator.userAgent)
    });
    
    const validateQRCode = async () => {
      setIsLoading(true);
      
      if (!id) {
        setIsValid(false);
        setValidationMessage('No QR code ID provided');
        console.error('No QR code ID provided in URL');
        setIsLoading(false);
        return;
      }
      
      try {
        // Try to retrieve the QR code
        const qrCode = await getQRCode(id);
        
        if (!qrCode) {
          console.log('QR code not found in storage. ID:', id);
          setIsValid(false);
          setValidationMessage('QR code not found. It may have been deleted or never existed.');
          setIsLoading(false);
          return;
        }
        
        console.log('QR code found:', qrCode);
        const valid = isQRCodeValid(qrCode);
        
        if (valid) {
          setContext(qrCode.context);
        } else {
          // Set appropriate validation message based on why it's invalid
          if (new Date() > new Date(qrCode.expiresAt)) {
            setValidationMessage('This QR code has expired.');
          } else if (qrCode.currentScans >= qrCode.maxScans) {
            setValidationMessage('This QR code has reached its maximum number of scans.');
          } else if (!qrCode.isActive) {
            setValidationMessage('This QR code has been deactivated.');
          }
        }
        
        setIsValid(valid);
      } catch (error) {
        console.error('Error validating QR code:', error);
        setIsValid(false);
        setValidationMessage('An error occurred while validating the QR code.');
      } finally {
        setIsLoading(false);
      }
    };
    
    validateQRCode();
  }, [id, retries]);
  
  const handleSubmitSuccess = () => {
    setSubmitted(true);
    // Redirect after 3 seconds
    setTimeout(() => {
      navigate('/thank-you');
    }, 3000);
  };
  
  const refreshQRCode = () => {
    setRetries(prev => prev + 1);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="animate-pulse text-center">
          <p className="text-lg">Loading...</p>
          <p className="text-sm text-muted-foreground mt-2">Checking QR code: {id}</p>
        </div>
      </div>
    );
  }
  
  if (!isValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Invalid QR Code
            </CardTitle>
            <CardDescription>
              This QR code is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {validationMessage || 'Please contact the administrator to get a new QR code.'}
            </p>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Debugging Info:</strong><br />
                QR Code ID: {id}<br />
                Browser: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}<br />
                Storage items: {Object.keys(localStorage).join(', ')}
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="outline"
                onClick={refreshQRCode}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-heading">
              Thank You!
            </CardTitle>
            <CardDescription>
              Your feedback has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You will be redirected in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md text-center mb-6">
        <h1 className="text-2xl font-bold gradient-heading mb-2">
          {context ? `Feedback for ${context}` : 'Provide Your Feedback'}
        </h1>
        <p className="text-muted-foreground">
          Your feedback is anonymous and helps us improve.
        </p>
      </div>
      
      <FeedbackForm 
        qrCodeId={id!} 
        onSubmitSuccess={handleSubmitSuccess} 
      />
    </div>
  );
};

export default FeedbackPage;
