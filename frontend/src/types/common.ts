// 共通の型定義
export interface Category {
  id: number
  name: string
}

export interface OrderItem {
  id: string
  menu_item: number
  menu_item_name: string
  menu_item_price: number
  category_name: string
  price: number
}

export interface Order {
  id: string
  timestamp: string
  gender: number
  gender_name: string
  order_type: number
  order_type_name: string
  weather: number
  weather_name: string
  time_slot: number
  time_slot_name: string
  total_price: number
  discount: number
  final_price: number
  items: OrderItem[]
}

