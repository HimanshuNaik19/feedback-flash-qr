import { useState } from 'react';
import { Feedback, getSentimentColor, getRatingEmoji, deleteFeedback } from '@/utils/sentimentUtils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";

interface FeedbackListProps {
  feedbackItems: Feedback[];
  onFeedbackDeleted?: () => void;
}

const FeedbackList = ({ feedbackItems, onFeedbackDeleted }: FeedbackListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  if (feedbackItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No feedback available for this filter.
      </div>
    );
  }
  
  const confirmDelete = async () => {
    if (feedbackToDelete) {
      const success = await deleteFeedback(feedbackToDelete);
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
  
  const handleDeleteClick = (id: string) => {
    setFeedbackToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setFeedbackToDelete(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedItems.includes(id);
  
  return (
    <>
      <div className="space-y-4">
        {feedbackItems.map((item) => (
          <div 
            key={item.id} 
            className="p-4 border rounded-lg flex flex-col gap-4 animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row justify-between gap-4">
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
              
              <div className="flex-shrink-0 flex items-start justify-end space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-500 hover:text-primary"
                  onClick={() => toggleExpand(item.id)}
                  title={isExpanded(item.id) ? "Hide details" : "Show details"}
                >
                  {isExpanded(item.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
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
            
            {/* Expanded details section */}
            {isExpanded(item.id) && (
              <div className="mt-2 pt-3 border-t text-sm">
                <h4 className="font-medium mb-2">Contact Information:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Name</Badge>
                    <span>{item.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />Phone
                    </Badge>
                    <span>{item.phoneNumber}</span>
                  </div>
                  
                  {item.email && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />Email
                      </Badge>
                      <span>{item.email}</span>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Technical Information:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Badge variant="outline">ID</Badge>
                        <div className="mt-1 text-xs text-muted-foreground break-all">{item.id}</div>
                      </div>
                      <div>
                        <Badge variant="outline">QR Code ID</Badge>
                        <div className="mt-1 text-xs text-muted-foreground break-all">{item.qrCodeId}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
