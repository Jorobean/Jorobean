import create from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      
      addToCart: (item) => set((state) => {
        const existingItem = state.cart.find(i => i.id === item.id)
        if (existingItem) {
          return {
            cart: state.cart.map(i => 
              i.id === item.id 
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            )
          }
        }
        return { cart: [...state.cart, item] }
      }),

      updateQuantity: (id, quantity) => set((state) => ({
        cart: quantity < 1 
          ? state.cart.filter(item => item.id !== id)
          : state.cart.map(item => 
              item.id === id ? { ...item, quantity } : item
            )
      })),

      clearCart: () => set({ cart: [] }),
      
      getCartTotal: () => {
        const { cart } = get()
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
      },
      
      getCartCount: () => {
        const { cart } = get()
        return cart.reduce((count, item) => count + item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage', // unique name for localStorage
      getStorage: () => localStorage
    }
  )
)
