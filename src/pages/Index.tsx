
import Layout from '@/components/Layout';
import FeedbackDashboard from '@/components/FeedbackDashboard';

const Index = () => {
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-heading">Dashboard</h1>
          <p className="text-muted-foreground">Monitor and analyze feedback in real-time</p>
        </div>
        
        <FeedbackDashboard />
      </div>
    </Layout>
  );
};

export default Index;
