
import Layout from '@/components/Layout';
import QRCodeGenerator from '@/components/QRCodeGenerator';

const GeneratePage = () => {
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-heading">Generate QR Code</h1>
          <p className="text-muted-foreground">Create customized QR codes for feedback collection</p>
        </div>
        
        <div className="flex justify-center py-8">
          <QRCodeGenerator />
        </div>
      </div>
    </Layout>
  );
};

export default GeneratePage;
