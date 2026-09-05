"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiUrl } from '../common/http';

export interface Product {
    id: number;
    category_id: number;
    brand_id: number;
    name: string;
    sku: string;
    description: string;
    base_price: number; // This should be number
    stock_quantity: number;
    weight: number;
    is_seasonal: boolean;
    seasonal_start_date: Date;
    seasonal_end_date: Date;
    images?: { image_url: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  setCartItems: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItemsState] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Restore cart items on initial client mount from localStorage & backend draft
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const restoreCart = async () => {
      let initialCart: CartItem[] = [];
      const stored = localStorage.getItem('shopping_cart_items');
      if (stored) {
        try {
          initialCart = JSON.parse(stored);
        } catch (e) {}
      }

      // Check backend draft cart items if user/session exists
      const sessionId = localStorage.getItem('checkout_session_id');
      const token = localStorage.getItem('adminToken');
      if (sessionId || token) {
        try {
          const headers: HeadersInit = { Accept: 'application/json' };
          if (sessionId) headers['X-Session-ID'] = sessionId;
          if (token) headers.Authorization = `Bearer ${token}`;

          const res = await fetch(`${apiUrl}/checkout/draft`, { headers });
          const data = await res.json();
          if (res.ok && data.data && Array.isArray(data.data.cart_items) && data.data.cart_items.length > 0) {
            initialCart = data.data.cart_items;
          }
        } catch (e) {}
      }

      setCartItemsState(initialCart);
      setIsLoaded(true);
    };

    restoreCart();
  }, []);

  // 2. Persist cart changes to localStorage & backend
  const updateAndPersistCart = (newItems: CartItem[]) => {
    setCartItemsState(newItems);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shopping_cart_items', JSON.stringify(newItems));
    }
  };

  const addToCart = (product: Product) => {
    const productWithNumberPrice = {
      ...product,
      base_price: Number(product.base_price)
    };

    const maxStock = Number(product.stock_quantity ?? product.stock ?? 999999);

    setCartItemsState(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      let updated: CartItem[];

      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + 1, maxStock);
        updated = prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQty }
            : item
        );
      } else {
        const initialQty = Math.min(1, maxStock);
        if (initialQty <= 0) return prevItems;
        updated = [...prevItems, { product: productWithNumberPrice, quantity: initialQty }];
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('shopping_cart_items', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItemsState(prevItems => {
      const updated = prevItems.filter(item => item.product.id !== productId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopping_cart_items', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItemsState(prevItems => {
      const updated = prevItems.map(item => {
        if (item.product.id === productId) {
          const maxStock = Number(item.product.stock_quantity ?? (item.product as any).stock ?? 999999);
          const newQty = Math.min(quantity, maxStock);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopping_cart_items', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCartItemsState([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopping_cart_items');
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.product.base_price);
      return total + price * item.quantity;
    }, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const setCartItems = (items: CartItem[]) => {
    updateAndPersistCart(items);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
        setCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}