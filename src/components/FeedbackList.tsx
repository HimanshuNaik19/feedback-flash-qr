
import { useState } from 'react';
import { Feedback, getSentimentColor, getRatingEmoji, deleteFeedback } from '@/utils/sentimentUtils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface FeedbackListProps {
  feedbackItems: Feedback[];
  onFeedbackDeleted?: () => void;
}

const FeedbackList = ({ feedbackItems, onFeedbackDeleted }: FeedbackListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  
  if (feedbackItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No feedback available for this filter.
      </div>
    );
  }
  
  const handleDeleteClick = (id: string) => {
    setFeedbackToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (feedbackToDelete) {
      const success = deleteFeedback(feedbackToDelete);
      if (success) {
        toast.success('Feedback deleted successfully');
        if (onFeedbackDeleted) {
          onFeedbackDeleted();
        }
      } else {
        toast.error('Failed to delete feedback');
      }
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setFeedbackToDelete(null);
  };
  
  return (
    <>
      <div className="space-y-4">
        {feedbackItems.map((item) => (
          <div 
            key={item.id} 
            className="p-4 border rounded-lg flex flex-col sm:flex-row gap-4 animate-fade-in"
          >
            <div className="flex-shrink-0 flex flex-col items-center justify-center">
              <span className="text-3xl mb-1">
                {getRatingEmoji(item.rating)}
              </span>
              <div 
                className={`text-xs font-medium px-2 py-1 rounded-full text-white ${getSentimentColor(item.sentiment)}`}
              >
                {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
              </div>
            </div>
            
            <div className="flex-grow">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                <p className="font-medium text-sm">{item.context}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <p className="text-sm">
                {item.comment || <span className="text-muted-foreground italic">No comment provided</span>}
              </p>
            </div>
            
            <div className="flex-shrink-0 flex items-start justify-end">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-500 hover:text-red-500"
                onClick={() => handleDeleteClick(item.id)}
                title="Delete feedback"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FeedbackList;
