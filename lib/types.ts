export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl: string
  videoUrl?: string
  available: boolean
}

export interface CartItem {
  product: Product
  quantity: number
  observations: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address: Address
  createdAt: Date
}

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export type DeliveryMethod = 'pickup' | 'delivery'

export type PaymentMethod = 'square' | 'cash' | 'pix'

export type OrderStatus = 
  | 'received' 
  | 'preparing' 
  | 'smoking' 
  | 'finished' 
  | 'out_for_delivery' 
  | 'delivered'

export interface Order {
  id: string
  customerId: string
  customer: Customer
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryMethod: DeliveryMethod
  scheduledDate?: Date
  scheduledTime?: string
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
}
