import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { adminConfig } from '../config/config';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface AdminAuthDialogProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

// Custom dialog content with higher z-index
const HighZIndexDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>((props, ref) => (
  <DialogContent
    ref={ref}
    className="z-[100] sm:max-w-md"
    {...props}
  />
));
HighZIndexDialogContent.displayName = "HighZIndexDialogContent";

const AdminAuthDialog: React.FC<AdminAuthDialogProps> = ({ isOpen, onSuccess, onClose }) => {
  const { address } = useAccount();
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = address ? 
    adminConfig.admins.some(admin => admin.address?.toLowerCase() === address?.toLowerCase()) 
    : false;
  
  // If the connected wallet isn't an admin, show an error
  if (!isAdmin) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <HighZIndexDialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500" />
              Not Authorized
            </DialogTitle>
            <DialogDescription>
              The connected wallet is not registered as an admin for this store.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </HighZIndexDialogContent>
      </Dialog>
    );
  }
  
  const handleAuthenticate = async () => {
    if (!address) return;
    
    try {
      setIsAuthenticating(true);
      setError(null);
      
      onSuccess();
    } catch (err: any) {
      console.error('Authentication error:', err);
      // Format error message for better user experience
      const errorMsg = 'Failed to authenticate. Please try again.';
      
      setError(errorMsg);
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <HighZIndexDialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Admin Authentication
          </DialogTitle>
          <DialogDescription>
            Please authenticate to verify you control this admin address.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mt-4 flex flex-col gap-4">
          <Button 
            onClick={handleAuthenticate} 
            className="w-full" 
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Authenticate'
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
            disabled={isAuthenticating}
          >
            Cancel
          </Button>
        </div>
      </HighZIndexDialogContent>
    </Dialog>
  );
};

export default AdminAuthDialog; 