import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, Customer, Address, DeliveryMethod, PaymentMethod, Order, OrderStatus } from './types'
import { mockOrders, mockCustomers } from './mock-data'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity: number, observations: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateObservations: (productId: string, observations: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity, observations) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.product.id === product.id)
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity, observations }
                  : item
              ),
            }
          }
          return { items: [...state.items, { product, quantity, observations }] }
        })
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }))
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }))
      },
      updateObservations: (productId, observations) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, observations } : item
          ),
        }))
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        )
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'lima-cart-storage',
    }
  )
)

interface CustomerStore {
  customer: Customer | null
  setCustomer: (customer: Customer) => void
  updateAddress: (address: Address) => void
  clearCustomer: () => void
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      customer: null,
      setCustomer: (customer) => set({ customer }),
      updateAddress: (address) =>
        set((state) => ({
          customer: state.customer ? { ...state.customer, address } : null,
        })),
      clearCustomer: () => set({ customer: null }),
    }),
    {
      name: 'lima-customer-storage',
    }
  )
)

interface CheckoutStore {
  deliveryMethod: DeliveryMethod
  scheduledDate: Date | null
  scheduledTime: string | null
  paymentMethod: PaymentMethod
  setDeliveryMethod: (method: DeliveryMethod) => void
  setScheduledDate: (date: Date | null) => void
  setScheduledTime: (time: string | null) => void
  setPaymentMethod: (method: PaymentMethod) => void
  reset: () => void
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  deliveryMethod: 'pickup',
  scheduledDate: null,
  scheduledTime: null,
  paymentMethod: 'square',
  setDeliveryMethod: (method) => set({ deliveryMethod: method }),
  setScheduledDate: (date) => set({ scheduledDate: date }),
  setScheduledTime: (time) => set({ scheduledTime: time }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  reset: () =>
    set({
      deliveryMethod: 'pickup',
      scheduledDate: null,
      scheduledTime: null,
      paymentMethod: 'square',
    }),
}))

interface OrderStore {
  orders: Order[]
  customers: Customer[]
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getTodayOrders: () => Order[]
  getTodayRevenue: () => number
  getAverageTicket: () => number
  getBestSellingProduct: () => { name: string; count: number } | null
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      customers: mockCustomers,
      addOrder: (order) => {
        set((state) => ({
          orders: [order, ...state.orders],
          customers: state.customers.some((c) => c.id === order.customer.id)
            ? state.customers
            : [...state.customers, order.customer],
        }))
      },
      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? { ...order, status, updatedAt: new Date() }
              : order
          ),
        }))
      },
      getOrdersByStatus: (status) => {
        return get().orders.filter((order) => order.status === status)
      },
      getTodayOrders: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return get().orders.filter((order) => {
          const orderDate = new Date(order.createdAt)
          orderDate.setHours(0, 0, 0, 0)
          return orderDate.getTime() === today.getTime()
        })
      },
      getTodayRevenue: () => {
        return get()
          .getTodayOrders()
          .reduce((sum, order) => sum + order.total, 0)
      },
      getAverageTicket: () => {
        const orders = get().getTodayOrders()
        if (orders.length === 0) return 0
        return orders.reduce((sum, order) => sum + order.total, 0) / orders.length
      },
      getBestSellingProduct: () => {
        const productCount: Record<string, { name: string; count: number }> = {}
        get()
          .getTodayOrders()
          .forEach((order) => {
            order.items.forEach((item) => {
              if (!productCount[item.product.id]) {
                productCount[item.product.id] = {
                  name: item.product.name,
                  count: 0,
                }
              }
              productCount[item.product.id].count += item.quantity
            })
          })
        const sorted = Object.values(productCount).sort(
          (a, b) => b.count - a.count
        )
        return sorted[0] || null
      },
    }),
    {
      name: 'lima-orders-storage',
    }
  )
)
