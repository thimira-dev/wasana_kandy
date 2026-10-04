"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { formatLKR } from "@/lib/domain/pricing";

export interface CartItem {
  id: string; // Unique cart item ID (productId + customization string)
  productId: string;
  name: string;
  slug: string;
  catalogueCode?: string | null;
  mainCategory?: string | null;
  basePrice: number;
  price: number;
  quantity: number;
  imageUrl?: string;
  customizationSummary?: Array<{
    groupName: string;
    fieldType: string;
    labelOrValue: string;
    priceAdjustment: string | number;
  }>;
  selections?: Record<string, any>;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addToCart: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: number;
  subtotal: number;
  subtotalFormatted: string;
  lastAddedItem: CartItem | null;
}

const CART_STORAGE_KEY = "wasana_shopping_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      } catch (err) {
        console.error("Failed to load cart from localStorage:", err);
      }
    }
  }, []);

  // Sync cart to localStorage
  const saveItems = (newItems: CartItem[]) => {
    setItems(newItems);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
      } catch (err) {
        console.error("Failed to save cart to localStorage:", err);
      }
    }
  };

  const addToCart = (
    itemData: Omit<CartItem, "id" | "quantity"> & { quantity?: number }
  ) => {
    const qtyToAdd = itemData.quantity && itemData.quantity > 0 ? itemData.quantity : 1;
    const customizationKey = itemData.customizationSummary
      ? JSON.stringify(itemData.customizationSummary)
      : "";
    const itemId = `${itemData.productId}_${customizationKey}`;

    const existingIndex = items.findIndex((item) => item.id === itemId);

    let updatedItems: CartItem[];
    let addedItem: CartItem;

    if (existingIndex > -1) {
      updatedItems = [...items];
      const existing = updatedItems[existingIndex];
      const newQty = existing.quantity + qtyToAdd;
      addedItem = { ...existing, quantity: newQty };
      updatedItems[existingIndex] = addedItem;
    } else {
      addedItem = {
        ...itemData,
        id: itemId,
        quantity: qtyToAdd,
      };
      updatedItems = [...items, addedItem];
    }

    saveItems(updatedItems);
    setLastAddedItem(addedItem);
    setIsOpen(true); // Automatically open cart drawer for user feedback
  };

  const removeFromCart = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const updated = items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
    saveItems(updated);
  };

  const clearCart = () => {
    saveItems([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const subtotalFormatted = useMemo(() => formatLKR(subtotal), [subtotal]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        totalItems,
        subtotal,
        subtotalFormatted,
        lastAddedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
