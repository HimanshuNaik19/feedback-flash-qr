import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Feedback, analyzeSentiment, saveFeedback, getRatingEmoji } from '@/utils/sentimentUtils';
import { getQRCode, incrementScan } from '@/utils/qrCodeUtils';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { storeFeedbackToStorage } from '@/utils/qrCode/storageUtils';
import { getSynchronizationStatus } from '@/utils/firebase/networkStatus';

interface FeedbackFormProps {
  qrCodeId: string;
  onSubmitSuccess?: () => void;
}

const FeedbackForm = ({ qrCodeId, onSubmitSuccess }: FeedbackFormProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [qrCodeContext, setQRCodeContext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  
  const loadQRCodeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsRetrying(retryCount > 0);
    
    try {
      // Check network status
      const syncStatus = await getSynchronizationStatus();
      setNetworkStatus(syncStatus);
      
      // Add retry logic for better reliability
      let retries = 3;
      let qrCode = null;
      
      while (retries > 0 && !qrCode) {
        try {
          console.log(`Loading QR code ${qrCodeId} (attempt ${4-retries})`);
          qrCode = await getQRCode(qrCodeId);
          if (qrCode) break;
        } catch (e) {
          console.warn(`Retry attempt ${4-retries} for QR code ${qrCodeId} failed:`, e);
          retries--;
          // Wait 1 second before retrying
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (qrCode) {
        console.log('QR code loaded successfully:', qrCode);
        setQRCodeContext(qrCode.context);
        
        // Increment scan count in the background
        incrementScan(qrCodeId).catch(err => {
          console.error('Failed to increment scan count:', err);
          // This isn't critical so we don't need to show an error to the user
        });
      } else {
        throw new Error('QR code not found or network issue');
      }
    } catch (err) {
      console.error('Error loading QR code data:', err);
      setError('Failed to load QR code data. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [qrCodeId, retryCount]);
  
  useEffect(() => {
    loadQRCodeData();
    
    // Set up periodic check if loading takes too long
    const timeoutId = setTimeout(() => {
      if (isLoading && !qrCodeContext) {
        setError('Loading is taking longer than expected. Please check your connection.');
      }
    }, 10000);
    
    return () => clearTimeout(timeoutId);
  }, [qrCodeId, loadQRCodeData, retryCount]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  const handleSubmit = async () => {
    // Validate form inputs
    if (rating === null) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    if (!comment.trim()) {
      toast.error('Please enter your comment');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create feedback object with required properties
      const newFeedback = {
        id: 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        qrCodeId,
        name,
        phoneNumber,
        email: email.trim() || undefined, // Only include email if provided
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment,
        context: qrCodeContext || 'Unknown',
        sentiment: analyzeSentiment(rating as number),
        createdAt: new Date().toISOString(),
        message: comment // Include message field for compatibility
      };
      
      // Store directly to localStorage using storageUtils function
      const success = await storeFeedbackToStorage(newFeedback);
      
      if (success) {
        // Show success message
        toast.success('Thank you for your feedback!');
        
        // Reset form
        setRating(null);
        setName('');
        setPhoneNumber('');
        setEmail('');
        setComment('');
        
        // Call success callback if provided
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        throw new Error('Failed to save feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const ratingOptions = [1, 2, 3, 4, 5];
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading feedback form<span className="dot-animation">...</span></p>
          {isRetrying && (
            <p className="text-sm text-muted-foreground mt-2">Retrying connection...</p>
          )}
          {qrCodeId && (
            <p className="text-xs text-muted-foreground mt-4 break-all">
              ID: {qrCodeId}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error
          </CardTitle>
          <CardDescription>There was a problem loading the feedback form</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center">{error}</p>
          
          {networkStatus === 'offline' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                You appear to be offline. Please check your internet connection and try again.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 flex-wrap">
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold gradient-heading">Share Your Feedback</CardTitle>
        <CardDescription>
          {qrCodeContext ? `Feedback for: ${qrCodeContext}` : 'Your feedback helps us improve'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">How would you rate your experience?</h3>
          <div className="flex justify-between items-center">
            {ratingOptions.map((value) => (
              <Button
                key={value}
                type="button"
                variant={rating === value ? "default" : "outline"}
                className={`h-14 w-14 text-2xl ${rating === value ? 'bg-feedback-blue' : ''}`}
                onClick={() => setRating(value)}
              >
                {getRatingEmoji(value)}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="comment">Comments *</Label>
          <Textarea
            id="comment"
            placeholder="Tell us more about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            required
          />
        </div>
        
        {networkStatus === 'offline' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>You're currently offline.</strong> Your feedback will be saved and sent when you're back online.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-feedback-blue hover:bg-feedback-darkblue" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeedbackForm;
