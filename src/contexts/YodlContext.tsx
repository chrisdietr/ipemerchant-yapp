import React, { createContext, useContext, useEffect, useState } from 'react';
import YappSDK, { FiatCurrency, Payment, isInIframe } from '@yodlpay/yapp-sdk';
import { adminConfig, shopConfig } from '../config/config';
import { generateConfirmationUrl } from '../utils/url';
import useDeviceDetection from '../hooks/useMediaQuery';

// Define the context types
interface YodlContextType {
  yodl: YappSDK;
  createPayment: (params: {
    amount: number;
    currency: string;
    description: string;
    orderId: string;
    memo?: string;
    metadata?: Record<string, any>;
    redirectUrl?: string;
    paymentAddress?: string;
    ethAddressFallback?: string;
  }) => Promise<Payment | null>;
  isInIframe: boolean;
  merchantAddress: string;
  merchantEns: string;
  parsePaymentFromUrl: () => Partial<Payment> | null;
  shopTelegramHandle: string;
  adminTelegram: string;
}

// Create context with default values
const YodlContext = createContext<YodlContextType>({
  yodl: null as any, // Avoid double YappSDK init; will be set by Provider
  createPayment: async () => null,
  isInIframe: false,
  merchantAddress: '',
  merchantEns: '',
  parsePaymentFromUrl: () => null,
  shopTelegramHandle: '',
  adminTelegram: '',
});

// Custom hook for accessing the Yodl context
export const useYodl = () => useContext(YodlContext);

interface YodlProviderProps {
  children: React.ReactNode;
}

// Helper to clean payment parameters from URL
const cleanPaymentUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('txHash');
  url.searchParams.delete('chainId');
  window.history.replaceState({}, document.title, url.toString());
};

export const YodlProvider: React.FC<YodlProviderProps> = ({ children }) => {
  // Initialize SDK once as a singleton
  const [yodl] = useState(() => new YappSDK());
  const isInIframeValue = isInIframe();
  
  // Use our media query-based detection
  const { isMobile, isTouch } = useDeviceDetection();
  
  // Get merchant address from validated config
  const merchantAdmin = adminConfig.admins[0];
  const merchantAddress = merchantAdmin.address || "";
  const merchantEns = merchantAdmin.ens || "";

  // Get telegram handles from config
  const shopTelegramHandle = (shopConfig && shopConfig.shops && shopConfig.shops[0]?.telegramHandle) || '';
  
  // Fallback to ENS/address as admin telegram if not present
  // Using type safety to avoid potential errors
  const admin = adminConfig?.admins?.[0] || {};
  const adminTelegram = (typeof admin === 'object') ? 
    // Check if 'telegram' property exists on admin object
    ('telegram' in admin ? admin.telegram : 
    // Otherwise fallback to ens or address
    admin.ens || admin.address || '') : '';

  // Check if debug mode is enabled
  const isDebugMode = window.location.search.includes('debug=true');

  // Log handler that respects debug mode
  const logDebug = (message: string, data?: any) => {
    if (isDebugMode) {
      if (data) {
        console.log(`[YodlContext] ${message}`, data);
      } else {
        console.log(`[YodlContext] ${message}`);
      }
    }
  };

  // Ensure we have an identifier and trigger appropriate handling
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!merchantAddress && !merchantEns) {
      const errorMsg = "No merchant address or ENS found in validated config. Payment requests will fail.";
      console.error(`CRITICAL: ${errorMsg}`);
      setIdentifierError(errorMsg);
      
      // Optional: Display an error toast or notification for better user feedback
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('yodl-config-error', { 
          detail: { message: errorMsg, severity: 'critical' } 
        }));
      }
    } else {
      setIdentifierError(null);
    }
  }, [merchantAddress, merchantEns]);

  // Check for payment information in URL on component mount
  useEffect(() => {
    // Parse payment information from URL (for redirect flow)
    const urlPaymentResult = yodl.parsePaymentFromUrl();

    if (urlPaymentResult && urlPaymentResult.txHash) {
      logDebug('Payment detected in URL:', urlPaymentResult);
      
      const orderId = (urlPaymentResult as any).memo || '';
        
      if (orderId) {
        // Payment was successful via redirect
        logDebug('Payment successful (redirect):', urlPaymentResult);
          
        // Store payment details
        try {
          localStorage.setItem(`payment_${orderId}`, JSON.stringify({
            txHash: urlPaymentResult.txHash,
            chainId: urlPaymentResult.chainId
          }));
          
          // Broadcast successful payment message
          const message = {
              type: 'payment_complete', 
            txHash: urlPaymentResult.txHash,
            chainId: urlPaymentResult.chainId,
              orderId
            };
            
          // Broadcast locally
          window.postMessage(message, '*');
          
          // Broadcast to parent if in iframe
            if (isInIframeValue && window.parent) {
            window.parent.postMessage(message, '*');
            }
          } catch (e) {
          console.error("Error saving payment details:", e);
          }
        }
      
      // Clean the URL to prevent duplicate processing on refresh
      cleanPaymentUrl();
    }
  }, [yodl, isInIframeValue, isDebugMode]);

  // Handle message events for payment completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      
      // Verify this is likely a Yodl payment message
      const isPaymentMessage = 
        data && 
        typeof data === 'object' && 
        !data.target && // Filter out browser extension messages
        data.txHash && 
        (data.orderId || data.memo);
      
      // Skip if already standardized to prevent loops
      if (isPaymentMessage && data.type !== 'payment_complete') {
        const txHash = data.txHash;
        const chainId = data.chainId;
        const orderId = data.orderId || data.memo;
          
        if (!txHash || !orderId) {
          logDebug("Message missing required transaction data", data);
          return;
        }
        
        logDebug(`Processing payment result for order ${orderId}:`, { txHash, chainId });
            
        // Store in localStorage for persistence
        try {
            localStorage.setItem(`payment_${orderId}`, JSON.stringify({ txHash, chainId }));
        } catch (err) {
          console.error("Failed to save payment data to localStorage:", err);
        }
            
        // Create standardized message
              const standardizedMessage = {
                type: 'payment_complete', 
                txHash,
                chainId,
                orderId
              };
              
        // Broadcast standardized message
        try {
              // Broadcast locally
              window.postMessage(standardizedMessage, '*');
              
          // Broadcast to parent if in iframe
              if (isInIframeValue && window.parent) {
                 window.parent.postMessage(standardizedMessage, '*');
              }
            } catch (e) {
          console.error("Error broadcasting message:", e);
      }
      }
    };

    // Add event listener
    window.addEventListener('message', handleMessage);
    
    // Clean up
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isInIframeValue, isDebugMode]);

  // Simple wrapper to expose the SDK's URL parsing function
  const parsePaymentFromUrl = () => {
    return yodl.parsePaymentFromUrl();
  };

  // Request a payment using the Yodl SDK
  const createPayment = async (params: {
    amount: number;
    currency: string;
    description: string;
    orderId: string;
    memo?: string;
    metadata?: Record<string, any>;
    redirectUrl?: string;
    paymentAddress?: string;
    ethAddressFallback?: string;
  }): Promise<Payment | null> => {
    try {
      // Get the recipient address, with fallbacks for ENS resolution failure
      let recipientIdentifier =
        params.paymentAddress ||
        (params.metadata && params.metadata.paymentAddress) ||
        merchantEns || merchantAddress;
      
      // Debug log for address resolution
      console.log('[Yodl] Resolving payment address:', {
        productAddress: params.paymentAddress,
        metadataAddress: params.metadata?.paymentAddress,
        merchantEns,
        merchantAddress,
        resolved: recipientIdentifier
      });
      
      // Check if we have a fallback ETH address
      const fallbackAddress = params.ethAddressFallback || 
                             (params.metadata && params.metadata.ethAddressFallback);
      
      // Safety check for valid recipient
      if (!recipientIdentifier || typeof recipientIdentifier !== 'string' || recipientIdentifier.length < 8) {
        console.warn('[Yodl] Invalid primary recipient:', recipientIdentifier);
        
        // If we have a fallback address, use it
        if (fallbackAddress && typeof fallbackAddress === 'string' && fallbackAddress.length >= 42) {
          console.log('[Yodl] Using fallback ETH address instead:', fallbackAddress);
          recipientIdentifier = fallbackAddress;
        } else {
          console.error('[Yodl] No valid address or fallback found:', { recipientIdentifier, fallbackAddress, params });
          throw new Error('Invalid or missing payment address for this product. Please contact support.');
        }
      }
      
      // Check if recipient looks like an ENS name, and we have a fallback
      const isEnsName = recipientIdentifier.includes('.eth') || recipientIdentifier.includes('.id');
      if (isEnsName && fallbackAddress && typeof fallbackAddress === 'string' && fallbackAddress.length >= 42) {
        console.log('[Yodl] Using direct ETH address instead of ENS to avoid resolution errors:', { 
          originalEns: recipientIdentifier, 
          usingAddress: fallbackAddress 
        });
        recipientIdentifier = fallbackAddress;
      }
      
      if (!params.amount || typeof params.amount !== 'number' || params.amount <= 0) {
        console.error('[Yodl] Invalid payment amount:', params.amount, params);
        throw new Error('Invalid payment amount.');
      }
      if (!params.currency) {
        console.error('[Yodl] Invalid payment currency:', params.currency, params);
        throw new Error('Invalid payment currency.');
      }
      
      // Generate confirmation URL that will work with direct navigation
      const confirmationUrl = generateConfirmationUrl(params.orderId);
      console.log("[Yodl] Generated confirmation URL:", confirmationUrl);
      
      // Save order details in localStorage so confirmation page can pick it up
      const orderDetails = {
        orderId: params.orderId,
        name: params.description,
        price: params.amount,
        currency: params.currency,
        timestamp: new Date().toISOString(),
        ...params.metadata
      };
      localStorage.setItem(params.orderId, JSON.stringify(orderDetails));
      console.log("[Yodl] Saved order details to localStorage:", orderDetails);
      
      // Create a promise that will resolve when the payment is complete
      // This is critical for iframe communication scenario
      let paymentCompleteResolver: (payment: Payment) => void;
      const paymentCompletePromise = new Promise<Payment>((resolve) => {
        paymentCompleteResolver = resolve;
      });
      
      // Set up a message listener to receive completion from the Yodl SDK
      const messageListener = (event: MessageEvent) => {
        // Filter out messages that don't have payment info
        if (!event.data || typeof event.data !== 'object') return;
        if (!event.data.txHash) return;
        
        console.log('[Yodl] Received message in payment handler:', event.data);
        
        // Check if this is a payment completion message that matches our current order
        const matchesOrder = event.data.orderId === params.orderId || 
                          event.data.memo === params.orderId ||
                          event.data.memo === params.memo;
        
        if (matchesOrder && event.data.txHash) {
          console.log('[Yodl] Payment completion message received for this order');
          
          // Standardize the payment data
          const payment: Payment = {
            txHash: event.data.txHash,
            chainId: event.data.chainId
          };
          
          // Save payment info to localStorage
          localStorage.setItem(`payment_${params.orderId}`, JSON.stringify(payment));
          
          // Create the full confirmation URL with txHash
          const url = new URL(confirmationUrl, window.location.origin);
          url.searchParams.set('txHash', payment.txHash);
          if (payment.chainId) {
            url.searchParams.set('chainId', payment.chainId.toString());
          }
          
          console.log('[Yodl] Navigating to confirmation URL:', url.toString());
          
          // Navigate to the confirmation page
          window.location.href = url.toString();
          
          // Resolve the payment promise
          paymentCompleteResolver(payment);
          
          // Remove this listener since we're done
          window.removeEventListener('message', messageListener);
        }
      };
      
      // Add the listener before making the payment request
      window.addEventListener('message', messageListener);
      
      const paymentOptions = {
        addressOrEns: recipientIdentifier,
        amount: params.amount,
        currency: params.currency as FiatCurrency,
        memo: params.memo || params.orderId,
        metadata: params.metadata,
        redirectUrl: confirmationUrl, // Always use our confirmation URL
        flow: 'iframe'
      };
      console.log('[Yodl] Requesting payment with options:', paymentOptions);
      logDebug('Requesting payment with options:', paymentOptions);
      
      // Handle preferred flow based on device/context
      let flow = 'iframe';
      
      // Use redirect flow for mobile/touch devices and when already in an iframe
      if (isMobile || isTouch || isInIframeValue) {
        flow = 'redirect';
        logDebug(`Using redirect flow due to: mobile=${isMobile}, touch=${isTouch}, iframe=${isInIframeValue}`);
      }
      paymentOptions.flow = flow;
      
      // Make the payment request
      const payment = await yodl.requestPayment(paymentOptions);
      logDebug('Payment created/requested:', payment);
      
      // If we get a payment result directly, use it
      if (payment && payment.txHash) {
        console.log('[Yodl] Direct payment result received:', payment);
        
        // Save to localStorage
        localStorage.setItem(`payment_${params.orderId}`, JSON.stringify(payment));
        
        // Create the full confirmation URL
        const url = new URL(confirmationUrl, window.location.origin);
        url.searchParams.set('txHash', payment.txHash);
        if (payment.chainId) {
          url.searchParams.set('chainId', payment.chainId.toString());
        }
        
        console.log('[Yodl] Navigating to confirmation URL:', url.toString());
        
        // Navigate to the confirmation page
        setTimeout(() => {
          window.location.href = url.toString();
        }, 300);
        
        // Clean up the message listener
        window.removeEventListener('message', messageListener);
        
        return payment;
      }
      
      // If we're here, the payment flow is async (iframe)
      // Wait for the payment to complete via message, or timeout after 5 minutes
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          window.removeEventListener('message', messageListener);
          resolve(null);
        }, 5 * 60 * 1000); // 5 minutes
      });
      
      // Race the payment completion against timeout
      const result = await Promise.race([paymentCompletePromise, timeoutPromise]);
      return result;
    } catch (error) {
      console.error('Error creating payment:', error);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('yodl-payment-error', { detail: error }));
      }
      return null;
    }
  };

  // Provide the context to children
  return (
    <YodlContext.Provider
      value={{
        yodl,
        createPayment,
        isInIframe: isInIframeValue,
        merchantAddress,
        merchantEns,
        parsePaymentFromUrl,
        shopTelegramHandle,
        adminTelegram,
      }}
    >
      {children}
    </YodlContext.Provider>
  );
}; 