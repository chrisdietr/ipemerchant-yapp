import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from '../config/config'; // Import shared Product type

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  emoji: string;
  inStock: boolean | "infinite";
  paymentAddress?: string;
  seller?: string;
  sellerTelegram?: string;
  onCheckout: (product: Product) => void;
}

const ProductCard = ({
  id,
  name,
  description,
  price,
  currency,
  emoji,
  inStock,
  paymentAddress,
  seller,
  sellerTelegram,
  onCheckout,
}: ProductCardProps) => {
  const productData: Product = { id, name, description, price, currency, emoji, inStock, paymentAddress, seller, sellerTelegram };

  const isAvailable = inStock === true || inStock === "infinite";
  
  // Add ethAddress fallback for each test product
  // These will be used if ENS resolution fails
  const ethAddressFallbacks: Record<string, string> = {
    '1': '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Shirt product fallback
    '2': '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Hat product fallback 
    '3': '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'  // Generic fallback for other products
  };
  
  const handleCheckout = () => {
    // Add the fallback eth address to ensure ENS failures don't block payment
    const productWithFallback = {
      ...productData,
      ethAddressFallback: ethAddressFallbacks[id] || ethAddressFallbacks['3']
    };
    onCheckout(productWithFallback);
  };

  const telegramMessage = encodeURIComponent(`I have a question about your product: ${name}`);
  const telegramLink = sellerTelegram ? `https://t.me/${sellerTelegram}?text=${telegramMessage}` : '#';

  return (
    <Card className="flex w-full max-w-full flex-col rounded-xl border border-pixelGray bg-pixelWhite shadow-sm dark:border-pixelGreen dark:bg-pixelBlack">
      <CardHeader className="flex flex-col gap-2 px-4 pb-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-bold text-black dark:text-pixelYellow sm:text-xl">{name}</CardTitle>
          <span
            className="ml-2 text-4xl drop-shadow-sm sm:text-5xl md:text-6xl"
            aria-label="Product emoji"
            data-component-name="ProductCard"
          >
            {emoji}
          </span>
        </div>
        <CardDescription className="min-h-8 text-sm text-pixelGray dark:text-pixelGray">{description}</CardDescription>
        {/* Seller info: always reserve space for consistent layout */}
        <div className="my-1 flex min-h-5 items-center justify-between">
          {seller ? (
            <span className="text-xs italic text-pixelGray dark:text-pixelGray">Seller: {seller}</span>
          ) : null}
          {sellerTelegram && (
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pixelGreen hover:text-pixelYellow dark:text-pixelGreen dark:hover:text-pixelYellow"
            >
              Contact Seller
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 px-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-pixelBlack dark:text-pixelWhite sm:text-2xl">{price} {currency}</span>
          {!isAvailable && <span className="ml-2 font-medium text-pixelGray">Sold Out</span>}
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-2">
        <Button
          onClick={handleCheckout}
          className={`w-full rounded-xl py-2 text-base font-semibold shadow-sm
            ${isAvailable ? 'bg-pixelGreen text-pixelBlack hover:bg-pixelYellow dark:bg-pixelGreen dark:hover:bg-pixelYellow' : 'cursor-not-allowed bg-pixelGray text-pixelGray dark:bg-[#232f1e] dark:text-pixelGray'}`}
          disabled={!isAvailable}
          variant={isAvailable ? "default" : "outline"}
        >
          {!isAvailable ? (
            "Sold Out"
          ) : (
            "Buy Now"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
