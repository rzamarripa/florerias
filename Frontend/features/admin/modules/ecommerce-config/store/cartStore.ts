import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  _id: string;
  nombre: string;
  precio: number;
  precioEditado?: number; // Precio personalizado del storage
  quantity: number;
  stock: number;
  imagen?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePrice: (productId: string, newPrice: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToCart: (product, quantity) => {
        set((state) => {
          const existingItem = state.items.find(item => item._id === product._id);
          
          if (existingItem) {
            // Si el producto ya existe, actualizar la cantidad
            const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
            return {
              items: state.items.map(item =>
                item._id === product._id
                  ? { ...item, quantity: newQuantity }
                  : item
              )
            };
          } else {
            // Si es un nuevo producto, agregarlo al carrito
            return {
              items: [...state.items, { ...product, quantity: Math.min(quantity, product.stock) }]
            };
          }
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item._id !== productId)
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map(item =>
            item._id === productId
              ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) }
              : item
          )
        }));
      },

      updatePrice: (productId, newPrice) => {
        set((state) => ({
          items: state.items.map(item =>
            item._id === productId
              ? { ...item, precioEditado: newPrice > 0 ? newPrice : item.precio }
              : item
          )
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.precioEditado || item.precio;
          return total + (price * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'ecommerce-cart-storage'
    }
  )
);