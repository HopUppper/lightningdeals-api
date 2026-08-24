import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminFetch } from '../utils/api';

export interface CartItem {
  id: string;
  planId: string;
  name: string;
  priceInr: number;
  originalPriceInr?: number;
  tokenDisplay: string;
  windowHours: number;
  validityDays: number;
  tagline?: string;
  badge?: string;
}

export interface AppliedCoupon {
  id?: string;
  code: string;
  discountType: string;
  discountValue: number;
  discountAmountInr: number;
  finalAmountInr: number;
  description?: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (planId: string) => void;
  clearCart: () => void;
  appliedCoupon: AppliedCoupon | null;
  couponLoading: boolean;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  totalPayable: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ld_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const saved = localStorage.getItem('ld_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('ld_cart', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('ld_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('ld_coupon');
      }
    } catch {}
  }, [appliedCoupon]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (item: CartItem) => {
    // Single active subscription checkout model: replace or add
    setCartItems([item]);
    setIsCartOpen(true);
    // Revalidate coupon on price change if coupon exists
    if (appliedCoupon) {
      applyCoupon(appliedCoupon.code, item.priceInr);
    }
  };

  const removeFromCart = (planId: string) => {
    setCartItems((prev) => prev.filter((i) => i.planId !== planId && i.id !== planId));
    if (cartItems.length <= 1) {
      setAppliedCoupon(null);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.priceInr, 0);

  const applyCoupon = async (code: string, overridePrice?: number): Promise<boolean> => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return false;
    }

    setCouponLoading(true);
    setCouponError(null);

    const checkPrice = overridePrice !== undefined ? overridePrice : subtotal;
    const planId = cartItems[0]?.planId || cartItems[0]?.id;

    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, planId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCouponError(data.error || 'Invalid or expired coupon code.');
        setAppliedCoupon(null);
        return false;
      }

      setAppliedCoupon({
        id: data.coupon?.id,
        code: data.coupon?.code || cleanCode,
        discountType: data.coupon?.discountType,
        discountValue: data.coupon?.discountValue,
        discountAmountInr: data.discountAmountInr,
        finalAmountInr: data.finalAmountInr,
        description: data.coupon?.description,
      });
      return true;
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon.');
      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Calculate live discount
  let discountAmount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  const totalPayable = Math.max(1, subtotal - discountAmount);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        clearCart,
        appliedCoupon,
        couponLoading,
        couponError,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        totalPayable: subtotal > 0 ? totalPayable : 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
