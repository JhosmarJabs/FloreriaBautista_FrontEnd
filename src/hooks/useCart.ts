import { useState, useEffect } from 'react';
import { scopedKey, limpiarClavesLegacy } from '../utils/userScope';
import { AdminService } from '../services/adminService';
import type { PricingBreakdown } from '../types';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Clave del carrito aislada por usuario (cart:<id> o cart:guest).
const cartKey = () => scopedKey('cart');

const leerCarrito = (): CartItem[] => {
  const savedCart = localStorage.getItem(cartKey());
  if (!savedCart) return [];
  try {
    return JSON.parse(savedCart);
  } catch (e) {
    console.error("Error parsing cart", e);
    return [];
  }
};

export const useCart = () => {
  // Inicial perezoso: el primer render ya trae el carrito guardado (si no, las
  // pantallas que dependen de él, como las recomendaciones, piden con el carrito vacío).
  const [cart, setCart] = useState<CartItem[]>(leerCarrito);

  // Desglose de precio: lo calcula SIEMPRE el backend (ofertas, descuentos automáticos
  // y cupón); aquí solo se guarda para mostrarlo. Nunca se envía un total al servidor.
  const [desglose, setDesglose] = useState<PricingBreakdown | null>(null);
  const [cupon, setCupon] = useState<string | null>(null);
  const [calculandoDesglose, setCalculandoDesglose] = useState(false);
  const [errorDesglose, setErrorDesglose] = useState('');

  useEffect(() => {
    // Elimina las claves globales viejas (no aisladas) que filtraban datos entre cuentas.
    limpiarClavesLegacy();

    const loadCart = () => setCart(leerCarrito());

    loadCart();

    const handleStorageChange = () => {
      loadCart();
    };

    window.addEventListener('cart-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange); // cambios entre pestañas
    window.addEventListener('auth-changed', handleStorageChange); // login/logout: recargar carrito del nuevo usuario

    return () => {
      window.removeEventListener('cart-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleStorageChange);
    };
  }, []);

  const addToCart = (product: any, quantity: number = 1) => {
    const currentCartStr = localStorage.getItem(cartKey());
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

    localStorage.setItem(cartKey(), JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeFromCart = (productId: string) => {
    const currentCartStr = localStorage.getItem(cartKey());
    if (!currentCartStr) return;

    let currentCart: CartItem[] = JSON.parse(currentCartStr);
    currentCart = currentCart.filter(item => item.id !== productId);

    localStorage.setItem(cartKey(), JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const currentCartStr = localStorage.getItem(cartKey());
    if (!currentCartStr) return;

    let currentCart: CartItem[] = JSON.parse(currentCartStr);
    const itemIndex = currentCart.findIndex(item => item.id === productId);

    if (itemIndex >= 0) {
      currentCart[itemIndex].quantity = quantity;
      localStorage.setItem(cartKey(), JSON.stringify(currentCart));
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  const clearCart = () => {
    localStorage.removeItem(cartKey());
    window.dispatchEvent(new Event('cart-updated'));
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const itemsParaPrecio = () => cart.map(i => ({ productId: i.id, cantidad: i.quantity }));

  // No se llama sola: la invoca el checkout (requiere sesión). Sin argumento conserva el cupón aplicado.
  const calcularDesglose = async (codigo: string | null = cupon) => {
    if (cart.length === 0) {
      setDesglose(null);
      return;
    }
    setCalculandoDesglose(true);
    setErrorDesglose('');
    try {
      const res = await AdminService.calcularPricing(itemsParaPrecio(), codigo || undefined);
      setDesglose(res.data);
    } catch (e: any) {
      setDesglose(null);
      setErrorDesglose(e?.message || 'No se pudo calcular el total.');
    } finally {
      setCalculandoDesglose(false);
    }
  };

  // Lanza un Error con el mensaje del backend si el cupón no es válido; el desglose previo se conserva.
  const aplicarCupon = async (codigo: string) => {
    const code = codigo.trim().toUpperCase();
    const res = await AdminService.aplicarCupon(itemsParaPrecio(), code);
    setDesglose(res.data);
    setCupon(code);
    setErrorDesglose('');
  };

  const quitarCupon = async () => {
    setCupon(null);
    await calcularDesglose(null);
  };

  return {
    cart, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart,
    desglose, cupon, calculandoDesglose, errorDesglose, calcularDesglose, aplicarCupon, quitarCupon,
  };
};
