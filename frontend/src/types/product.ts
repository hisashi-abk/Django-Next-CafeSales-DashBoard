// 商品関連の型定義
export interface Bestseller {
  menu_item__category__name: string
  menu_item__name: string
  menu_item__price: number
  total_quantity: number
  total_sales: number
}

export interface MenuItem {
  id: number
  name: string
  price: number
  category: number
  category_name: string
}
