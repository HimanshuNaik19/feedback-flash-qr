
import { Check } from 'lucide-react';

const ThankYouPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-feedback-blue/10 to-white">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center space-y-6">
        <div className="mx-auto bg-feedback-blue/10 p-4 rounded-full w-20 h-20 flex items-center justify-center">
          <Check className="h-10 w-10 text-feedback-blue" />
        </div>
        
        <h1 className="text-3xl font-bold gradient-heading">Thank You!</h1>
        
        <p className="text-gray-600">
          Your feedback has been submitted successfully and will help us improve our services.
        </p>
        
        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            For privacy reasons, you can now close this page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
