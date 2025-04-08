
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QrCode, BarChart2, Plus, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: <BarChart2 className="h-5 w-5" /> 
    },
    { 
      name: 'Generate QR', 
      path: '/generate', 
      icon: <QrCode className="h-5 w-5" /> 
    },
    {
      name: 'Manage QR Codes',
      path: '/manage',
      icon: <List className="h-5 w-5" />
    }
  ];
  
  return (
    <nav className="bg-feedback-darkblue text-white p-4 flex flex-col justify-between min-h-screen fixed left-0 z-10 transition-all duration-300"
      style={{ width: isExpanded ? '220px' : '72px' }}
    >
      <div>
        <div className="flex items-center justify-center mb-8 overflow-hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-white/10"
          >
            {isExpanded ? (
              <div className="flex items-center">
                <QrCode className="h-6 w-6 mr-2" />
                <span className="font-bold">FeedbackQR</span>
              </div>
            ) : (
              <QrCode className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center rounded-md p-3 text-sm transition-colors hover:bg-white/10",
                location.pathname === item.path ? "bg-white/20" : "transparent"
              )}
            >
              {item.icon}
              {isExpanded && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </div>
      </div>
      
      <div>
        <Link 
          to="/generate" 
          className="flex items-center rounded-md p-3 text-sm transition-colors hover:bg-white/10 bg-feedback-blue hover:bg-feedback-blue/80"
        >
          <Plus className="h-5 w-5" />
          {isExpanded && <span className="ml-3">New QR Code</span>}
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
