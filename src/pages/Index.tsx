
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import FeedbackDashboard from '@/components/FeedbackDashboard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const queryClient = useQueryClient();
  
  const handleRefresh = useCallback(async () => {
    try {
      // Show toast for refresh start
      toast.info('Refreshing dashboard data...');
      
      // Invalidate and refetch all queries
      await queryClient.invalidateQueries();
      
      // Show success toast
      toast.success('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data. Please try again.');
    }
  }, [queryClient]);
  
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold gradient-heading">Dashboard</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        
        <FeedbackDashboard />
      </div>
    </Layout>
  );
};

export default Index;
