import React, { useContext, useState, useEffect } from "react";
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import { useYodl } from '../contexts/YodlContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import ThemeToggle from './ThemeToggle';
import { useToast } from "./ui/use-toast";
import { shopConfig, Category, Product } from '../config/config';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Config from env
const adminConfig = JSON.parse(import.meta.env.VITE_ADMIN_CONFIG || '{}');

const Home = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { createPayment, isInIframe, merchantAddress } = useYodl();
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  // Determine if admin mode is active
  const isAdmin = address && merchantAddress && address.toLowerCase() === merchantAddress.toLowerCase();

  // Refactored payment initiation logic
  const handleInitiateCheckout = async (product: Product) => {
    if (!product) {
      toast({ title: "Error", description: "Missing product info.", variant: "destructive" });
      return;
    }
    // --- ADDED: Log product and payment address for debugging ---
    console.log('[Yodl] Initiating checkout for product:', product);
    if (!product.paymentAddress || typeof product.paymentAddress !== 'string' || product.paymentAddress.length < 8) {
      console.warn('[Yodl] Product is missing or has invalid payment address:', product.paymentAddress, product);
    }
    setIsProcessingPayment(product.id);

    // --- Generate unique memo/orderId using maximum available space within 32 bytes ---
    function hashStringTo5Digit(str: string): string {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
      }
      return Math.abs(hash % 100000).toString().padStart(5, '0');
    }

    // Create meaningful name using maximum available space (32 bytes - 6 bytes for _XXXXX = 26 bytes)
    const createMaxName = (name: string): string => {
      const MAX_NAME_LENGTH = 26; // 32 bytes - 5 for hash - 1 for underscore
      const words = name.split(/\s+/);
      
      // If total length is already under limit, just clean it
      if (name.length <= MAX_NAME_LENGTH) {
        return name.replace(/[^a-zA-Z0-9]/g, '');
      }
      
      // For longer names, try to keep meaningful parts
      if (words.length > 1) {
        // Try to keep first letters of all words plus as much of the first word as possible
        const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
        const remainingSpace = MAX_NAME_LENGTH - acronym.length;
        if (remainingSpace > 0) {
          // Add as much of the first word as possible
          const firstWord = words[0].replace(/[^a-zA-Z0-9]/g, '');
          return (firstWord.slice(0, remainingSpace) + acronym)
            .slice(0, MAX_NAME_LENGTH);
        }
        return acronym.slice(0, MAX_NAME_LENGTH);
      }
      
      // For single long word, just truncate
      return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, MAX_NAME_LENGTH);
    };

    const now = new Date();
    const salt = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const base = `${product.name}_${now.getUTCHours()}${now.getUTCMinutes()}${salt}`;
    const fiveDigit = hashStringTo5Digit(base);
    
    const truncatedName = createMaxName(product.name);
    const memo = `${truncatedName}_${fiveDigit}`;
    const orderId = memo;

    try {
      await createPayment({
        amount: product.price,
        currency: product.currency,
        description: product.name,
        orderId,
        memo,
        paymentAddress: product.paymentAddress || merchantAddress,
        metadata: { 
          productId: product.id, 
          productName: product.name, 
          paymentAddress: product.paymentAddress || merchantAddress 
        },
      });
      toast({ title: "Payment Initiated", description: `Order ${orderId} started.`, variant: "default" });
    } catch (e) {
      toast({ title: "Payment Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsProcessingPayment(null);
    }
  };

  // --- ADDED: Listen for global Yodl payment errors and show toast ---
  useEffect(() => {
    function handleYodlPaymentError(e: any) {
      const err = e.detail;
      toast({ title: "Payment Error", description: err?.message || String(err), variant: "destructive" });
    }
    window.addEventListener('yodl-payment-error', handleYodlPaymentError);
    return () => window.removeEventListener('yodl-payment-error', handleYodlPaymentError);
  }, [toast]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'name'|'price'|'order'>('order');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('asc');
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const handleSortDirectionToggle = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const categories: Category[] = shopConfig.categories || [];
  const allProducts: Product[] = shopConfig.products || [];

  const filteredProducts = allProducts
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'price') cmp = a.price - b.price;
      else if (sortKey === 'order') cmp = (a.order || 0) - (b.order || 0);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="pixel-bg min-h-screen w-full">
      <header className="flex w-full items-center justify-between px-4 pb-2 pt-4">
        <h1 className="text-2xl font-bold text-pixelYellow drop-shadow-lg sm:text-3xl" data-component-name="Home">{shopConfig.shops[0]?.name || "Shop"}</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
      {/* Line separator and Products title */}
      <div className="flex w-full flex-col items-start px-4 md:px-8">
        <hr className="my-4 w-full border-t-2 border-pixelYellow/80" />
        <h2 className="mb-6 text-xl font-extrabold tracking-wide text-pixelYellow drop-shadow-lg sm:text-2xl" data-component-name="Home" style={{ marginLeft: 0 }}>Merchants</h2>
      </div>
      <main className="mx-auto w-full flex-1 px-4 md:px-8" style={{ background: 'transparent' }}>
        <div className="my-3 flex w-full flex-col gap-1">
          {categories.map(cat => {
            const productsForCat = filteredProducts.filter(p => p.category === cat.id);
            return (
              <div
                key={cat.id}
                id={`category-section-${cat.id}`}
                className="mb-5"
                style={{ scrollMarginTop: 100 }}
              >
                <h2 className="mb-5 flex max-w-full items-center gap-2 truncate text-lg font-extrabold text-white drop-shadow-lg sm:text-xl" data-component-name="Home">
                  {cat.emoji ? <span className="text-xl leading-none sm:text-2xl">{cat.emoji}</span> : null}{cat.name}
                </h2>
                {cat.description && <p className="mb-4 text-sm text-gray-400 [&_a]:underline" dangerouslySetInnerHTML={{ __html: cat.description }} />}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
                  {productsForCat.map(product => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      description={product.description}
                      price={product.price}
                      currency={product.currency}
                      emoji={product.emoji}
                      inStock={product.inStock}
                      paymentAddress={product.paymentAddress}
                      seller={product.seller}
                      sellerTelegram={product.sellerTelegram}
                      onCheckout={handleInitiateCheckout}
                    />
                  ))}
                  {productsForCat.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-500">No products found.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Home;
