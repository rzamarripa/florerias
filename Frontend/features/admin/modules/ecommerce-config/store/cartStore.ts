import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  _id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precioEditado?: number; // Precio personalizado del storage
  quantity: number;
  stock: number; // Stock disponible actual
  originalStock: number; // Stock original del almacén
  imagen?: string;
  productCategory?: any;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  availableStock: Record<string, number>; // Stock disponible por producto
  addToCart: (product: Omit<CartItem, 'quantity' | 'originalStock'>, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePrice: (productId: string, newPrice: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getAvailableStock: (productId: string) => number;
  initializeStock: (products: Array<{ _id: string; stock: number }>) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      availableStock: {},

      addToCart: (product, quantity) => {
        set((state) => {
          const existingItem = state.items.find(item => item._id === product._id);
          const availableStock = state.availableStock[product._id] ?? product.stock;
          
          if (existingItem) {
            // Si el producto ya existe, actualizar la cantidad
            const newQuantity = Math.min(existingItem.quantity + quantity, availableStock);
            const stockUsed = newQuantity - existingItem.quantity;
            
            return {
              items: state.items.map(item =>
                item._id === product._id
                  ? { ...item, quantity: newQuantity }
                  : item
              ),
              availableStock: {
                ...state.availableStock,
                [product._id]: availableStock - stockUsed
              }
            };
          } else {
            // Si es un nuevo producto, agregarlo al carrito
            const actualQuantity = Math.min(quantity, availableStock);
            return {
              items: [...state.items, { 
                ...product, 
                quantity: actualQuantity,
                originalStock: product.stock,
                stock: availableStock
              }],
              availableStock: {
                ...state.availableStock,
                [product._id]: availableStock - actualQuantity
              }
            };
          }
        });
      },

      removeFromCart: (productId) => {
        set((state) => {
          const item = state.items.find(item => item._id === productId);
          if (!item) return state;
          
          // Devolver el stock al disponible
          const currentAvailable = state.availableStock[productId] ?? 0;
          
          return {
            items: state.items.filter(item => item._id !== productId),
            availableStock: {
              ...state.availableStock,
              [productId]: currentAvailable + item.quantity
            }
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          const item = state.items.find(item => item._id === productId);
          if (!item) return state;
          
          const currentAvailable = state.availableStock[productId] ?? item.originalStock;
          const maxQuantity = currentAvailable + item.quantity; // Stock disponible + lo que ya tenemos
          const newQuantity = Math.min(Math.max(1, quantity), maxQuantity);
          const stockDifference = newQuantity - item.quantity;
          
          return {
            items: state.items.map(item =>
              item._id === productId
                ? { ...item, quantity: newQuantity }
                : item
            ),
            availableStock: {
              ...state.availableStock,
              [productId]: currentAvailable - stockDifference
            }
          };
        });
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
        set((state) => {
          // Restaurar todo el stock disponible
          const restoredStock: Record<string, number> = {};
          state.items.forEach(item => {
            const currentAvailable = state.availableStock[item._id] ?? 0;
            restoredStock[item._id] = currentAvailable + item.quantity;
          });
          
          return { 
            items: [],
            availableStock: restoredStock
          };
        });
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
      },
      
      getAvailableStock: (productId: string) => {
        return get().availableStock[productId] ?? 0;
      },
      
      initializeStock: (products) => {
        set((state) => {
          const newStock: Record<string, number> = {};
          products.forEach(product => {
            // Si ya hay items en el carrito, descontar del stock inicial
            const cartItem = state.items.find(item => item._id === product._id);
            if (cartItem) {
              newStock[product._id] = product.stock - cartItem.quantity;
            } else {
              newStock[product._id] = product.stock;
            }
          });
          
          return { availableStock: newStock };
        });
      }
    }),
    {
      name: 'ecommerce-cart-storage'
    }
  )
);