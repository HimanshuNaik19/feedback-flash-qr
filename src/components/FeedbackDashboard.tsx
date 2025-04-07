
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllFeedback, getSentimentColor, Feedback } from '@/utils/sentimentUtils';
import { getAllQRCodes } from '@/utils/qrCodeUtils';
import FeedbackStats from './FeedbackStats';
import FeedbackList from './FeedbackList';

const FeedbackDashboard = () => {
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  
  useEffect(() => {
    // In a real app, this would fetch data from an API
    const feedback = getAllFeedback();
    setFeedbackItems(feedback);
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      setFeedbackItems(getAllFeedback());
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const filterFeedback = (sentiment: string) => {
    if (sentiment === 'all') return feedbackItems;
    return feedbackItems.filter(item => item.sentiment === sentiment);
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
        <CardHeader>
          <CardTitle>Feedback Results</CardTitle>
          <CardDescription>View and filter feedback responses</CardDescription>
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
              <FeedbackList feedbackItems={filteredFeedback} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackDashboard;
