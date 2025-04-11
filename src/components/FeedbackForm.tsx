
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Feedback, analyzeSentiment, saveFeedback, getRatingEmoji } from '@/utils/sentimentUtils';
import { getQRCode, incrementScan } from '@/utils/qrCodeUtils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface FeedbackFormProps {
  qrCodeId: string;
  onSubmitSuccess?: () => void;
}

const FeedbackForm = ({ qrCodeId, onSubmitSuccess }: FeedbackFormProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeContext, setQRCodeContext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadQRCodeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Add retry logic for better reliability
        let retries = 3;
        let qrCode = null;
        
        while (retries > 0 && !qrCode) {
          try {
            qrCode = await getQRCode(qrCodeId);
            if (qrCode) break;
          } catch (e) {
            console.log(`Retry attempt ${4-retries} for QR code ${qrCodeId}`);
            retries--;
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (qrCode) {
          setQRCodeContext(qrCode.context);
        } else {
          setError('Could not find the QR code. It may have expired or been deleted.');
        }
      } catch (err) {
        console.error('Error loading QR code data:', err);
        setError('Failed to load QR code data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQRCodeData();
  }, [qrCodeId]);
  
  const handleSubmit = async () => {
    if (rating === null) {
      toast.error('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get QR code details and increment scan counter
      const qrCode = await getQRCode(qrCodeId);
      if (!qrCode) {
        toast.error('Invalid QR code');
        setIsSubmitting(false);
        return;
      }
      
      await incrementScan(qrCodeId);
      
      // Create feedback object
      const feedback: Omit<Feedback, 'id' | 'createdAt' | 'sentiment'> = {
        qrCodeId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment,
        context: qrCode.context
      };
      
      // Store feedback
      await saveFeedback(feedback);
      
      // Show success message
      toast.success('Thank you for your feedback!');
      
      // Reset form
      setRating(null);
      setComment('');
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
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
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading feedback form...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-500">Error</CardTitle>
          <CardDescription>There was a problem loading the feedback form</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center">{error}</p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try Again
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
          <h3 className="text-sm font-medium">Additional comments (optional)</h3>
          <Textarea
            placeholder="Tell us more about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>
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
