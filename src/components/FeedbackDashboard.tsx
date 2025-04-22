
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { getAllFeedbackFromMongoDB } from '@/utils/feedback/feedbackMongodb';

const FeedbackDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Use React Query for feedback data with 5-second polling
  const { data: feedbackItems = [], isLoading: isFeedbackLoading } = useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      try {
        // Try to get data from MongoDB first
        const mongoData = await getAllFeedbackFromMongoDB();
        console.log('Loaded feedback data from MongoDB:', mongoData.length, 'items');
        return mongoData;
      } catch (error) {
        console.error('Error loading from MongoDB, falling back to local:', error);
        // Fallback to local data
        const localData = getAllFeedback();
        console.log('Loaded feedback data from local:', localData.length, 'items');
        return localData;
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
  
  // Use React Query for QR code data with 5-second polling
  const { data: qrCodesData = { activeCount: 0, expiredCount: 0 }, isLoading: isQRCodeLoading } = useQuery({
    queryKey: ['qrCodes'],
    queryFn: async () => {
      try {
        const qrCodes = await getAllQRCodes();
        const activeQRCodes = qrCodes.filter(qr => qr.isActive).length;
        const expiredQRCodes = qrCodes.length - activeQRCodes;
        
        return {
          activeCount: activeQRCodes,
          expiredCount: expiredQRCodes
        };
      } catch (error) {
        console.error('Error loading QR code data:', error);
        return { activeCount: 0, expiredCount: 0 };
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
  
  const filterFeedback = (sentiment: string) => {
    if (sentiment === 'all') return feedbackItems;
    return feedbackItems.filter(item => item.sentiment === sentiment);
  };
  
  const handleDeleteAllFeedback = async () => {
    try {
      const success = await deleteAllFeedback();
      if (success) {
        toast.success('All feedback has been deleted');
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['feedback'] });
      } else {
        toast.error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('An error occurred while deleting feedback');
    } finally {
      setDeleteAllDialogOpen(false);
    }
  };
  
  const filteredFeedback = filterFeedback(selectedTab);
  
  // Count for each sentiment type
  const positiveCount = feedbackItems.filter(f => f.sentiment === 'positive').length;
  const neutralCount = feedbackItems.filter(f => f.sentiment === 'neutral').length;
  const negativeCount = feedbackItems.filter(f => f.sentiment === 'negative').length;
  
  return (
    <div className="space-y-6">
      <FeedbackStats 
        totalFeedback={feedbackItems.length}
        positive={positiveCount}
        neutral={neutralCount}
        negative={negativeCount}
        activeQRCodes={qrCodesData.activeCount}
        expiredQRCodes={qrCodesData.expiredCount}
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
              {isFeedbackLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-center">
                    <p className="text-muted-foreground">Loading feedback data...</p>
                  </div>
                </div>
              ) : (
                <FeedbackList 
                  feedbackItems={filteredFeedback} 
                  onFeedbackDeleted={() => queryClient.invalidateQueries({ queryKey: ['feedback'] })}
                />
              )}
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
