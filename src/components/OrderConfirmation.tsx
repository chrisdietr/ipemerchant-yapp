import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useYodl } from "../contexts/YodlContext";
import { useTheme } from '../contexts/ThemeContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Loader2, ExternalLink, Send, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';
import { shopConfig, Product } from '../config/config';
import { generateConfirmationUrl } from "@/utils/url";
import useDeviceDetection from "../hooks/useMediaQuery";
import { fetchTransactionDetails } from "../utils/dateUtils";
import ThemeToggle from "./ThemeToggle";

interface PaymentResult {
  txHash?: string | null; 
  chainId?: number | undefined;
}

interface TransactionDetails {
  payment?: {
    memo?: string;
    blockTimestamp?: string;
  };
  metadata?: {
    productName?: string;
    price?: number;
    currency?: string;
  };
}

interface OrderDetails {
  name: string;
  price: number;
  currency: string;
  emoji: string;
  timestamp: string;
  sellerTelegram?: string;
}

const OrderConfirmation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { yodl, merchantAddress, merchantEns, isInIframe, parsePaymentFromUrl, adminTelegram } = useYodl(); 
  const { theme } = useTheme();
  const [orderId, setOrderId] = useState<string>('');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [orderedProduct, setOrderedProduct] = useState<Product | null>(null);
  
  const orderIdFromUrl = searchParams.get("orderId");
  const urlTxHash = searchParams.get("txHash");
  const urlChainId = searchParams.get("chainId");

  const shop = shopConfig.shops[0];
  const shopTelegramHandle = shop?.telegramHandle;
  
  // Use our media query-based detection instead
  const { isMobile, isTouch } = useDeviceDetection();

  // Helper function to clean specific parameters from URL without reload
  const cleanUrlParams = (paramsToRemove: string[]) => {
    const newSearchParams = new URLSearchParams(searchParams);
    paramsToRemove.forEach(param => newSearchParams.delete(param));
    // Use replace: true to avoid adding to browser history
    setSearchParams(newSearchParams, { replace: true }); 
  };

  // Refactor: On mount, if txHash is present in URL, fetch payment details immediately and set orderId/orderDetails directly
  useEffect(() => {
    if (!orderIdFromUrl || !urlTxHash) {
      setError("Order ID or payment hash missing from URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setOrderId('');
    setOrderDetails(null);

    let retryTimeout: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxAttempts = 6; // Try for ~30s (6*5s)

    const fetchPayment = async () => {
      try {
        const apiResp = await fetch(`https://tx.yodl.me/api/v1/payments/${urlTxHash}`);
        let payment = null;
        if (apiResp.ok) {
          const details = await apiResp.json();
          payment = details.payment || details;
        }
        if (payment) {
          const memo = payment.memo || '';
          setOrderId(memo);
          let matchedProduct = null;
          if (memo && shopConfig && Array.isArray(shopConfig.products)) {
            const productPrefix = memo.split('_')[0].toLowerCase();
            matchedProduct = shopConfig.products.find(p =>
              p.id.toLowerCase() === productPrefix ||
              (p.name && p.name.toLowerCase() === productPrefix)
            );
          }
          const name = matchedProduct ? matchedProduct.name : '';
          const emoji = matchedProduct ? matchedProduct.emoji : '';
          const price = matchedProduct ? matchedProduct.price : payment.amount || 0;
          const currency = matchedProduct ? matchedProduct.currency : payment.currency || '';
          const sellerTelegram = matchedProduct ? matchedProduct.sellerTelegram : shopTelegramHandle;
          setOrderDetails({
            name,
            price,
            currency,
            emoji,
            timestamp: payment.blockTimestamp || payment.timestamp || '',
            sellerTelegram
          });
          setTransactionDetails(payment);
          setIsLoading(false);
        } else {
          if (attempts < maxAttempts) {
            attempts++;
            retryTimeout = setTimeout(fetchPayment, 5000); // Retry in 5s
          } else {
            setOrderDetails(null);
            setOrderId('');
            setError('Could not fetch transaction/payment details after multiple attempts. Please check your transaction hash or try again later.');
            setIsLoading(false);
          }
        }
      } catch (fetchErr) {
        if (attempts < maxAttempts) {
          attempts++;
          retryTimeout = setTimeout(fetchPayment, 5000); // Retry in 5s
        } else {
          setOrderDetails(null);
          setOrderId('');
          setError('Error fetching transaction details after multiple attempts. Please check your connection or try again.');
          setIsLoading(false);
        }
      }
    };
    fetchPayment();
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [orderIdFromUrl, urlTxHash]);

  // Document title effect
  useEffect(() => {
    if (orderDetails) {
      document.title = `Order Confirmation - ${orderDetails.name}`;
    } else if (orderIdFromUrl) {
      document.title = `Order Status - ${orderIdFromUrl}`;
    } else {
      document.title = "Order Status"; // Keep this for when no orderId
    }
    
    // Set the default title on cleanup
    return () => {
      document.title = "Merchant Yapp"; 
    };
  }, [orderDetails, orderIdFromUrl]);

  // Render Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-16 animate-spin text-black" />
        <p className="ml-4">Checking payment status...</p>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
         <XCircle className="mb-4 size-16 text-destructive" />
         <h2 className="mb-2 text-2xl font-bold">Error</h2>
         <p className="mb-6 text-destructive">{error}</p>
         <Button asChild variant="outline">
           <Link to="/">
             <Home className="mr-2 size-4" />
             Return to Home
           </Link>
         </Button>
       </div>
    );
  }

  // Main Render Logic
  const isSuccess = !!orderDetails;
  const displayMemo = transactionDetails?.payment?.memo || orderIdFromUrl;

  // Modify QR Code generation to include the displayed memo/orderId
  const generateQrUrl = () => {
    const url = new URL(generateConfirmationUrl(displayMemo || ""));
    
    // Payment info
    if (urlTxHash) {
      url.searchParams.set('txHash', urlTxHash);
    }
    if (urlChainId !== undefined) {
      url.searchParams.set('chainId', String(urlChainId));
    }
    
    // Order details (only if available)
    if (orderDetails) {
      url.searchParams.set('name', orderDetails.name);
      url.searchParams.set('price', orderDetails.price.toString());
      url.searchParams.set('currency', orderDetails.currency);
      if (orderDetails.emoji) {
        url.searchParams.set('emoji', orderDetails.emoji);
      }
      
      // For timestamp, store the ISO string 
      const rawTimestamp = new Date().toISOString();
      url.searchParams.set('timestamp', encodeURIComponent(rawTimestamp));
    }
    
    return url.toString();
  };
  const receiptQrValue = generateQrUrl();
  
  // Log the final QR value
  console.log("Final QR Code Value:", receiptQrValue);

  // Corrected URL prefix for yodlTxUrl
  const yodlTxUrl = isSuccess ? `https://yodl.me/tx/${urlTxHash}` : '';

  // Find the matched product from shopConfig.products
  const matchedProduct = shopConfig.products.find(p =>
    p.id.toLowerCase() === orderIdFromUrl?.split('_')[0].toLowerCase() ||
    (p.name && p.name.toLowerCase() === orderIdFromUrl?.split('_')[0].toLowerCase())
  );

  const sellerTelegram = matchedProduct?.sellerTelegram || shopTelegramHandle || adminTelegram;

  const telegramMessage = isSuccess && orderDetails && sellerTelegram
    ? encodeURIComponent([
        `Hey, I just bought ${orderDetails.name} from ${shopConfig.shops[0]?.name || 'your shop'}.`,
        '',
        'Where can I pick it up?',
        '',
        `Here is the receipt: https://yodl.me/tx/${urlTxHash}`
      ].join('\n'))
    : '';

  const telegramLink = sellerTelegram
    ? `https://t.me/${sellerTelegram}?text=${telegramMessage}`
    : '#';

  return (
    <div className="pixel-bg min-h-screen bg-black">
      {/* Responsive header and buttons */}
      <header className="flex w-full items-center justify-between px-4 pb-2 pt-4" data-component-name="OrderConfirmation">
        <h1 className="text-xl font-bold text-pixelYellow">Order Confirmation</h1>
        <div className="flex items-center gap-2" data-component-name="OrderConfirmation">
          {/* Contact Seller Button with prepopulated message */}
          <a href={telegramLink} target="_blank" rel="noopener noreferrer"
            className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-black shadow transition-colors hover:bg-pixelGreen sm:px-4 sm:py-2 sm:text-base"
            style={{minWidth: '48px', textAlign: 'center', lineHeight: 1.2}}>
            Contact Seller
          </a>
          <a href="/" className="rounded-lg bg-white px-3 py-1 text-sm font-semibold text-black shadow transition-colors hover:bg-pixelYellow sm:px-4 sm:py-2 sm:text-base"
            style={{minWidth: '70px', textAlign: 'center'}}>
            Home
          </a>
          <span className="scale-90 sm:scale-100"><ThemeToggle /></span>
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col items-center justify-center px-2 pb-6">
        <div className={`mb-4 w-full rounded-xl border shadow-lg ${theme === 'light' ? 'border-pixelGray bg-pixelWhite text-pixelBlack' : 'border-pixelGreen bg-pixelBlack text-pixelGreen'}`} data-component-name="OrderConfirmation">
          <CardHeader>
            {isSuccess ? (
              <>
                <div className="mt-2 flex flex-col items-center gap-2">
                  <CheckCircle className="size-16" style={{ color: '#22c55d' }} />
                  <span className="text-base font-extrabold" style={{ color: '#22c55d' }} data-component-name="OrderConfirmation">Status: Confirmed</span>
                </div>
                <p className="my-2 text-center text-sm text-muted-foreground dark:text-pixelWhite" data-component-name="_c6">Your order has been confirmed and is being processed.</p>
                {isSuccess && (
                  <div className="my-2 flex justify-center">
                    <div className="flex flex-col items-center rounded-lg bg-white p-2" data-component-name="OrderConfirmation">
                      <QRCodeCanvas 
                        value={receiptQrValue}
                        size={180} 
                        level={"H"}
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                  </div>
                )}
                {isSuccess && orderDetails && (
                  <>
                    <div
                      className="mt-2 text-center text-3xl font-extrabold"
                      style={{ color: '#22c55d', background: 'none' }}
                      data-component-name="OrderConfirmation"
                    >
                      {orderDetails.price} {orderDetails.currency}
                    </div>
                    {/* Separator between price and order summary */}
                    <Separator className="my-2" />
                  </>
                )}
              </>
            ) : (
              <CardTitle className="text-center text-2xl">Order Status</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-2">
              <div className={`rounded-lg px-2 py-3 sm:px-6 sm:py-4 ${theme === 'light' ? 'border border-pixelGray bg-pixelGray text-pixelBlack [&_*]:text-pixelBlack' : 'border border-pixelGreen bg-[#232f1e] text-pixelWhite [&_*]:text-pixelWhite'}`} data-component-name="OrderConfirmation" style={{width: '100%', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto'}}>
                <h3 className="mb-2 text-center text-base font-semibold sm:text-lg" data-component-name="OrderConfirmation">Order Summary</h3>
                <div className="grid grid-cols-2 items-center gap-x-5 gap-y-1 text-sm">
                  <span className="text-muted-foreground dark:text-pixelWhite">Order ID:</span>
                  <span className="break-all text-right dark:text-pixelWhite" data-component-name="OrderConfirmation">{orderId || "N/A"}</span>
                </div>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 items-center gap-x-5 gap-y-1 text-sm">
                  <span className="text-muted-foreground dark:text-pixelWhite">Product:</span>
                  <span className="flex items-center justify-end gap-1 text-right dark:text-pixelWhite">{orderDetails?.emoji} {orderDetails?.name}</span>
                </div>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 items-center gap-x-5 gap-y-1 text-sm">
                  <span className="text-muted-foreground dark:text-pixelWhite">Price:</span>
                  <span className="text-right dark:text-pixelWhite">{orderDetails?.price} {orderDetails?.currency}</span>
                </div>
              </div>
              
              {warning && (
                <div className="mb-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-800">
                  {warning}
                </div>
              )}
              
              <p className="my-2 text-center text-sm text-muted-foreground dark:text-pixelWhite" data-component-name="OrderConfirmation">Thank you for your purchase!</p>
              <div className="mt-2 flex flex-col items-center gap-2">
                <a href={yodlTxUrl} target="_blank" rel="noopener noreferrer" className="text-center font-semibold text-pixelYellow underline transition-colors hover:text-pixelGreen" data-component-name="OrderConfirmation">
                  View Receipt
                </a>
                <Button onClick={() => window.location.href = '/'} variant="default" className="rounded-lg px-8 py-2 text-base font-semibold">
                  Done
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </main>
      <style>
        {`
          html, body, #root {
            min-height: 100vh;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
          body {
            background: linear-gradient(180deg, #000000 0%, #000000 100%) !important;
          }
          @media (max-width: 640px) {
            .bg-muted.rounded-lg {
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100% !important;
              max-width: 100vw !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default OrderConfirmation; 