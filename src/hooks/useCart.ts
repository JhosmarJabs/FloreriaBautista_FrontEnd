import { useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Error parsing cart", e);
        }
      }
    };

    loadCart();

    const handleStorageChange = () => {
      loadCart();
    };

    window.addEventListener('cart-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange); // Also listen to cross-tab changes

    return () => {
      window.removeEventListener('cart-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addToCart = (product: any, quantity: number = 1) => {
    const currentCartStr = localStorage.getItem('cart');
    let currentCart: CartItem[] = [];
    if (currentCartStr) {
      try {
        currentCart = JSON.parse(currentCartStr);
      } catch (e) {}
    }

    // Normaliza el producto: acepta tanto el formato de la API
    // (nombre/precioBase/imagenUrl) como el ya normalizado (name/price/image).
    const normalized = {
      id: product.id,
      name: product.name ?? product.nombre ?? '',
      price: Number(product.price ?? product.precioBase ?? 0),
      image: product.image ?? product.imagenUrl ?? undefined,
    };

    const existingItemIndex = currentCart.findIndex(item => item.id === normalized.id);

    if (existingItemIndex >= 0) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push({
        id: normalized.id,
        name: normalized.name,
        price: normalized.price,
        quantity: quantity,
        image: normalized.image
      });
    }

    localStorage.setItem('cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeFromCart = (productId: string) => {
    const currentCartStr = localStorage.getItem('cart');
    if (!currentCartStr) return;
    
    let currentCart: CartItem[] = JSON.parse(currentCartStr);
    currentCart = currentCart.filter(item => item.id !== productId);
    
    localStorage.setItem('cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const currentCartStr = localStorage.getItem('cart');
    if (!currentCartStr) return;
    
    let currentCart: CartItem[] = JSON.parse(currentCartStr);
    const itemIndex = currentCart.findIndex(item => item.id === productId);
    
    if (itemIndex >= 0) {
      currentCart[itemIndex].quantity = quantity;
      localStorage.setItem('cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cart-updated'));
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return { cart, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart };
};
