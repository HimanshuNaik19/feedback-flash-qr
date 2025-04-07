
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface FeedbackStatsProps {
  totalFeedback: number;
  positive: number;
  neutral: number;
  negative: number;
  activeQRCodes: number;
  expiredQRCodes: number;
}

const FeedbackStats = ({
  totalFeedback,
  positive,
  neutral,
  negative,
  activeQRCodes,
  expiredQRCodes
}: FeedbackStatsProps) => {
  const chartData = [
    { name: 'Positive', value: positive, fill: '#10b981' },
    { name: 'Neutral', value: neutral, fill: '#f59e0b' },
    { name: 'Negative', value: negative, fill: '#ef4444' }
  ];
  
  const qrCodesData = [
    { name: 'Active', value: activeQRCodes, fill: '#0ea5e9' },
    { name: 'Expired', value: expiredQRCodes, fill: '#94a3b8' }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="col-span-1">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Feedback Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-2xl font-bold">{totalFeedback}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sentiment Ratio</p>
                <p className="text-2xl font-bold">
                  {totalFeedback > 0 
                    ? Math.round((positive / totalFeedback) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active QR Codes</p>
                <p className="text-2xl font-bold">{activeQRCodes}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expired QR Codes</p>
                <p className="text-2xl font-bold">{expiredQRCodes}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Feedback Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackStats;
