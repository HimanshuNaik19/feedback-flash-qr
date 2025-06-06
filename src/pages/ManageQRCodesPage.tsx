
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import QRCodeEditor from '@/components/QRCodeEditor';
import { 
  getAllQRCodes, 
  QRCodeContext, 
  deleteQRCode, 
  getQRCodeUrl 
} from '@/utils/qrCodeUtils';
import { deleteFeedback } from '@/utils/sentimentUtils';
import { getFeedbackByQRCodeId, deleteFeedbackByQRCodeId } from '@/utils/feedback/feedbackFirestore';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash, Eye, Loader2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const ManageQRCodesPage = () => {
  const navigate = useNavigate();
  const [qrCodes, setQRCodes] = useState<QRCodeContext[]>([]);
  const [showQRCode, setShowQRCode] = useState<QRCodeContext | null>(null);
  const [editQRCode, setEditQRCode] = useState<QRCodeContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteFeedbackDialog, setShowDeleteFeedbackDialog] = useState<string | null>(null);
  const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);
  
  const loadQRCodes = async () => {
    setIsLoading(true);
    try {
      const codes = await getAllQRCodes();
      setQRCodes(codes);
    } catch (error) {
      console.error('Error loading QR codes:', error);
      toast.error('Failed to load QR codes');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadQRCodes();
    // Set up polling to refresh QR codes regularly
    const intervalId = setInterval(() => {
      loadQRCodes();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleDeleteQRCode = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this QR code?')) {
      try {
        const success = await deleteQRCode(id);
        if (success) {
          toast.success('QR code deleted successfully');
          loadQRCodes();
        } else {
          toast.error('Failed to delete QR code');
        }
      } catch (error) {
        console.error('Error deleting QR code:', error);
        toast.error('An error occurred while deleting the QR code');
      }
    }
  };
  
  const handleDeleteFeedback = async (qrCodeId: string) => {
    setIsDeletingFeedback(true);
    try {
      const success = await deleteFeedbackByQRCodeId(qrCodeId);
      if (success) {
        toast.success('Feedback deleted successfully');
      } else {
        toast.error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('An error occurred while deleting feedback');
    } finally {
      setIsDeletingFeedback(false);
      setShowDeleteFeedbackDialog(null);
    }
  };
  
  const handleEditSuccess = () => {
    toast.success('QR code updated successfully');
    setEditQRCode(null);
    loadQRCodes();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const isExpired = (qrCode: QRCodeContext) => {
    if (!qrCode.isActive) return true;
    
    const now = new Date();
    const expiresAt = new Date(qrCode.expiresAt);
    
    return now > expiresAt || qrCode.currentScans >= qrCode.maxScans;
  };
  
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-heading">Manage QR Codes</h1>
            <p className="text-muted-foreground">View, edit, and manage your QR codes</p>
          </div>
          
          <Button 
            onClick={() => navigate('/generate')}
            className="bg-feedback-blue hover:bg-feedback-darkblue"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New QR Code
          </Button>
        </div>
        
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading QR codes...</span>
            </div>
          ) : (
            <Table>
              <TableCaption>A list of your generated QR codes.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Context</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Scans</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No QR codes found</p>
                      <Button 
                        onClick={() => navigate('/generate')}
                        variant="outline" 
                        className="mt-4"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Your First QR Code
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  qrCodes.map((qrCode) => (
                    <TableRow key={qrCode.id} className={isExpired(qrCode) ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{qrCode.context}</TableCell>
                      <TableCell>{formatDate(qrCode.createdAt)}</TableCell>
                      <TableCell>{formatDate(qrCode.expiresAt)}</TableCell>
                      <TableCell>{qrCode.currentScans} / {qrCode.maxScans}</TableCell>
                      <TableCell>
                        {isExpired(qrCode) ? (
                          <span className="text-red-500">Expired</span>
                        ) : (
                          <span className="text-green-500">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowQRCode(qrCode)}
                            title="View QR Code"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setEditQRCode(qrCode)}
                            title="Edit QR Code"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowDeleteFeedbackDialog(qrCode.id)}
                            title="Delete Feedback"
                            className="text-amber-600 border-amber-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteQRCode(qrCode.id)}
                            title="Delete QR Code"
                            className="text-destructive border-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      
      {/* QR Code View Dialog */}
      <Dialog open={showQRCode !== null} onOpenChange={() => setShowQRCode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code: {showQRCode?.context}</DialogTitle>
            <DialogDescription>
              Scan this QR code to collect feedback
            </DialogDescription>
          </DialogHeader>
          
          {showQRCode && (
            <div className="flex flex-col items-center space-y-4">
              <QRCodeDisplay 
                value={getQRCodeUrl(window.location.origin, showQRCode.id)} 
                size={250} 
              />
              <p className="text-sm text-center mt-2 text-muted-foreground break-all">
                {getQRCodeUrl(window.location.origin, showQRCode.id)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Feedback Dialog */}
      <Dialog 
        open={showDeleteFeedbackDialog !== null} 
        onOpenChange={(open) => !open && setShowDeleteFeedbackDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600">Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all feedback for this QR code? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteFeedbackDialog(null)}
              disabled={isDeletingFeedback}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteFeedbackDialog && handleDeleteFeedback(showDeleteFeedbackDialog)}
              disabled={isDeletingFeedback}
            >
              {isDeletingFeedback ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete All Feedback</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Edit Dialog */}
      {editQRCode && (
        <QRCodeEditor 
          qrCode={editQRCode} 
          onSuccess={handleEditSuccess}
          onCancel={() => setEditQRCode(null)}
        />
      )}
    </Layout>
  );
};

export default ManageQRCodesPage;
