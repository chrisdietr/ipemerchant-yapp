import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  User,
} from "lucide-react";
import { useYodl } from '../contexts/YodlContext';
import { useNavigate } from 'react-router-dom';
import { generateConfirmationUrl } from "@/utils/url";
import { Product } from '../config/config';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onInitiateCheckout: (product: Product, buyerName: string) => Promise<void>;
}

const CheckoutModal = ({
  isOpen,
  onClose,
  product,
  onInitiateCheckout,
}: CheckoutModalProps) => {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "processing" | "success" | "failed"
  >("pending");
  const [progress, setProgress] = useState(0);
  const { createPayment, merchantAddress, merchantEns, isInIframe } = useYodl();
  const [orderId] = useState(() => `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  const [buyerName, setBuyerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && product) {
      setPaymentStatus("pending");
      setProgress(0);
      try {
        localStorage.setItem(`order_${orderId}`, JSON.stringify({
          name: product.name,
          price: product.price,
          currency: product.currency,
          emoji: product.emoji,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        console.error("Failed to save order details to localStorage", e);
      }
    } else if (!isOpen) {
      setPaymentStatus("pending");
      setProgress(0);
    }
  }, [isOpen, product, orderId]);

  const handleStartPayment = async () => {
    if (!product) return;
    
    if (!buyerName.trim()) {
      setError("Please enter your name (max 8 characters).");
      return;
    }
    if (buyerName.length > 8) {
      setError("Name cannot exceed 8 characters.");
      return;
    }
    
    setError(null);
    setPaymentStatus("processing");
    setProgress(10);

    const timestamp = Date.now().toString().substring(6);
    
    const productNameShort = product.name.substring(0, 8).replace(/\s+/g, '_');
    const userNameShort = buyerName.trim().substring(0, 8).replace(/[^a-zA-Z0-9_-]/g, '_');
    const formattedOrderId = `${productNameShort}_for_${userNameShort}_${timestamp}`;
    
    const finalOrderId = formattedOrderId.substring(0, 31);

    try {
      const confirmationUrl = generateConfirmationUrl(orderId);
      console.log(`Starting payment for order ${finalOrderId}${isInIframe ? ' (in iframe mode)' : ''}`);

      const messageHandler = (event: MessageEvent) => {
        const data = event.data;
        
        if (data && typeof data === 'object' && data.type === 'payment_complete' && data.orderId === orderId) {
          console.log('Received payment completion message:', data);
          setProgress(100);
          setPaymentStatus("success");
          
          setTimeout(() => {
            navigate(`/confirmation?orderId=${orderId}`);
            onClose();
          }, 1500);
          
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);

      const payment = await createPayment({
        amount: product.price,
        currency: product.currency,
        description: product.name,
        orderId: finalOrderId,
        paymentAddress: product.paymentAddress,
        metadata: {
          productId: product.id,
          productName: product.name,
          paymentAddress: product.paymentAddress,
          orderId: orderId,
          customerName: buyerName.trim(),
          emoji: product.emoji,
          quantity: "1"
        },
        redirectUrl: confirmationUrl
      });

      console.log('Payment request successful (or redirect initiated):', payment);

      if (payment?.txHash) {
        try {
          localStorage.setItem(`payment_${orderId}`, JSON.stringify({
            txHash: payment.txHash,
            chainId: payment.chainId
          }));
        } catch (e) {
          console.error("Failed to save payment result to localStorage", e);
        }
        setProgress(100);
        setPaymentStatus("success");
        
        if (isInIframe) {
          setTimeout(() => {
            navigate(`/confirmation?orderId=${orderId}`);
            onClose();
          }, 1500);
        }
      } else {
        setPaymentStatus("processing");
        setProgress(50);
      }
      
      return () => {
        window.removeEventListener('message', messageHandler);
      };

    } catch (error: any) {
      console.error('Payment failed:', error);
      if (error.message?.includes('cancelled') || error.code === 4001) {
        console.log('User cancelled the payment');
        setPaymentStatus("pending");
      } else if (error.message?.includes('timed out')) {
        console.log('Payment request timed out');
        setPaymentStatus("failed");
      } else {
        setPaymentStatus("failed");
      }
      setProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`mx-auto w-full max-w-md rounded-xl border border-pixelGray bg-pixelWhite p-6 shadow-lg dark:border-pixelGreen dark:bg-pixelBlack`}>
        <DialogHeader>
          <DialogTitle className={`mb-4 text-lg font-bold text-pixelBlack dark:text-pixelGreen`}>
            <span>{product?.emoji}</span>
            <span>Checkout</span>
          </DialogTitle>
          {!isInIframe && product && (
            <DialogDescription>
              {product.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-3 sm:mt-4">
          <Card className="border border-border">
            <CardContent className="px-3 pt-4 sm:px-6 sm:pt-6">
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-4">
                <div>
                  <h3 className="text-base font-medium sm:text-lg">{product?.name}</h3>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-bold sm:text-lg">
                    {product?.price} {product?.currency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-3 sm:my-4" />
        
        <div className="mb-3 sm:mb-4">
          <Label htmlFor="buyerName" className="text-sm font-medium">
            Your Name (for Memo) <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1 flex items-center sm:mt-1.5">
            <User className="mr-2 size-4 text-muted-foreground" />
            <Input
              id="buyerName"
              placeholder="Max 8 characters"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="flex-1"
              maxLength={8}
              required
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your name is required and will be included in the transaction memo for seller identification
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {paymentStatus === "pending" && (
          <div className="flex flex-col items-center">
            <Button
              onClick={handleStartPayment}
              className="w-full py-6 text-lg font-medium"
              size="lg"
            >
              Pay
            </Button>
          </div>
        )}

        {paymentStatus === "processing" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="size-12 animate-spin text-primary sm:size-16" />
            <h3 className="text-lg font-medium sm:text-xl">Processing Payment</h3>
            <Progress value={progress} className="w-full max-w-xs" />
            <p className="px-4 text-center text-sm text-muted-foreground">
              {isInIframe ? 'Waiting for confirmation...' : 'Please complete the payment in your wallet or on the Yodl page.'}
            </p>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="size-12 text-green-500 sm:size-16" />
            <h3 className="text-lg font-medium sm:text-xl">Payment Successful!</h3>
            <p className="px-4 text-center text-sm text-muted-foreground">
              Your transaction is confirmed. Redirecting soon...
            </p>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <XCircle className="size-12 text-red-500 sm:size-16" />
            <h3 className="text-lg font-medium sm:text-xl">Payment Failed</h3>
            <p className="px-4 text-center text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </p>
            <Button onClick={handleStartPayment} variant="outline">Try Again</Button>
          </div>
        )}

        <div className="mt-4 flex justify-end sm:mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
