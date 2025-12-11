export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  color: string;
  colorHex: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderFormData {
  firstName: string;
  lastName: string;
  phone: string;
  municipality: string;
  city: string;
  address: string;
  email: string;
}
