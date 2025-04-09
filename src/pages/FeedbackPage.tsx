
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQRCode, isQRCodeValid } from '@/utils/qrCodeUtils';
import FeedbackForm from '@/components/FeedbackForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const FeedbackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  
  useEffect(() => {
    if (!id) {
      setIsValid(false);
      setValidationMessage('No QR code ID provided');
      console.error('No QR code ID provided in URL');
      return;
    }
    
    console.log('Checking QR code validity for ID:', id);
    console.log('Current URL path:', window.location.pathname);
    console.log('Current URL:', window.location.href);
    
    const qrCode = getQRCode(id);
    
    if (!qrCode) {
      console.log('QR code not found in storage. ID:', id);
      console.log('Available QR codes:', localStorage.getItem('qrCodes'));
      setIsValid(false);
      setValidationMessage('QR code not found. It may have been deleted or never existed.');
      return;
    }
    
    console.log('QR code found:', qrCode);
    const valid = isQRCodeValid(qrCode);
    
    if (!valid) {
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
    setContext(qrCode.context);
  }, [id]);
  
  const handleSubmitSuccess = () => {
    setSubmitted(true);
    // Redirect after 3 seconds
    setTimeout(() => {
      navigate('/thank-you');
    }, 3000);
  };
  
  if (isValid === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="animate-pulse text-center">
          <p className="text-lg">Loading...</p>
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
          <CardContent>
            <p className="text-center text-muted-foreground">
              {validationMessage || 'Please contact the administrator to get a new QR code.'}
            </p>
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
