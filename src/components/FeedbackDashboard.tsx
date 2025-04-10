
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getAllFeedback, getSentimentColor, Feedback, deleteAllFeedback } from '@/utils/sentimentUtils';
import { getAllQRCodes } from '@/utils/qrCodeUtils';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import FeedbackStats from './FeedbackStats';
import FeedbackList from './FeedbackList';

const FeedbackDashboard = () => {
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  
  const loadFeedbackData = () => {
    // Get the latest feedback data from localStorage
    const feedback = getAllFeedback();
    console.log('Loaded feedback data:', feedback.length, 'items');
    setFeedbackItems(feedback);
  };
  
  useEffect(() => {
    // Load initial data
    loadFeedbackData();
    
    // Set up polling for real-time updates (every 2 seconds)
    const intervalId = setInterval(() => {
      loadFeedbackData();
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const filterFeedback = (sentiment: string) => {
    if (sentiment === 'all') return feedbackItems;
    return feedbackItems.filter(item => item.sentiment === sentiment);
  };
  
  const handleDeleteAllFeedback = () => {
    const success = deleteAllFeedback();
    if (success) {
      toast.success('All feedback has been deleted');
      loadFeedbackData();
    } else {
      toast.error('Failed to delete feedback');
    }
    setDeleteAllDialogOpen(false);
  };
  
  const qrCodes = getAllQRCodes();
  const activeQRCodes = qrCodes.filter(qr => qr.isActive).length;
  const expiredQRCodes = qrCodes.length - activeQRCodes;
  
  const filteredFeedback = filterFeedback(selectedTab);
  
  return (
    <div className="space-y-6">
      <FeedbackStats 
        totalFeedback={feedbackItems.length}
        positive={feedbackItems.filter(f => f.sentiment === 'positive').length}
        neutral={feedbackItems.filter(f => f.sentiment === 'neutral').length}
        negative={feedbackItems.filter(f => f.sentiment === 'negative').length}
        activeQRCodes={activeQRCodes}
        expiredQRCodes={expiredQRCodes}
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Feedback Results</CardTitle>
            <CardDescription>View and filter feedback responses</CardDescription>
          </div>
          
          {feedbackItems.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => setDeleteAllDialogOpen(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger 
                value="positive" 
                className="flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${getSentimentColor('positive')}`}></div>
                Positive
              </TabsTrigger>
              <TabsTrigger 
                value="neutral"
                className="flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${getSentimentColor('neutral')}`}></div>
                Neutral
              </TabsTrigger>
              <TabsTrigger 
                value="negative"
                className="flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${getSentimentColor('negative')}`}></div>
                Negative
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedTab}>
              <FeedbackList 
                feedbackItems={filteredFeedback} 
                onFeedbackDeleted={loadFeedbackData}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        {feedbackItems.length > 0 && (
          <CardFooter className="pt-0 text-xs text-muted-foreground">
            Showing {filteredFeedback.length} of {feedbackItems.length} feedback items
          </CardFooter>
        )}
      </Card>
      
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all feedback data? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllFeedback}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FeedbackDashboard;
