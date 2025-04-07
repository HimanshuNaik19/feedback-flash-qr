
import { Feedback, getSentimentColor, getRatingEmoji } from '@/utils/sentimentUtils';
import { format } from 'date-fns';

interface FeedbackListProps {
  feedbackItems: Feedback[];
}

const FeedbackList = ({ feedbackItems }: FeedbackListProps) => {
  if (feedbackItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No feedback available for this filter.
      </div>
    );
  }
  
  return (
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
        </div>
      ))}
    </div>
  );
};

export default FeedbackList;
