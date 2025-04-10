import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Feedback, analyzeSentiment, saveFeedback, getRatingEmoji } from '@/utils/sentimentUtils';
import { incrementScan, getQRCode } from '@/utils/qrCodeUtils';
import { toast } from 'sonner';

interface FeedbackFormProps {
  qrCodeId: string;
  onSubmitSuccess?: () => void;
}

const FeedbackForm = ({ qrCodeId, onSubmitSuccess }: FeedbackFormProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = () => {
    if (rating === null) {
      toast.error('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    
    // Get QR code details and increment scan counter
    const qrCode = getQRCode(qrCodeId);
    if (!qrCode) {
      toast.error('Invalid QR code');
      setIsSubmitting(false);
      return;
    }
    
    incrementScan(qrCodeId);
    
    // Analyze sentiment based on rating
    const sentiment = analyzeSentiment(rating as 1 | 2 | 3 | 4 | 5);
    
    // Create feedback object
    const feedback: Omit<Feedback, 'id' | 'createdAt' | 'sentiment'> = {
      qrCodeId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      comment,
      context: qrCode.context
    };
    
    // Store feedback
    saveFeedback(feedback);
    
    // Show success message
    toast.success('Thank you for your feedback!');
    
    // Reset form
    setRating(null);
    setComment('');
    setIsSubmitting(false);
    
    // Call success callback if provided
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
  };
  
  const ratingOptions = [1, 2, 3, 4, 5];
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold gradient-heading">Share Your Feedback</CardTitle>
        <CardDescription>Your feedback helps us improve</CardDescription>
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
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeedbackForm;
