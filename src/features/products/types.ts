import {
  Bike,
  Cable,
  Car,
  CookingPot,
  Droplets,
  Dumbbell,
  Footprints,
  Gem,
  Glasses,
  Lamp,
  Laptop,
  LucideIcon,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  SprayCan,
  Tablet,
  Watch,
} from "lucide-react";

/** A product, as the app names DummyJSON's fields. */
export interface Product {
  productId: number;
  name: string;
  description: string;
  /** The category's slug, e.g. "home-decoration". */
  category: string;
  price: number;
  stock: number;
  /** A picture's URL. */
  thumbnail: string;
  /** How much is left, as a StatusBadge word: "in_stock", "low_stock" or "out_of_stock". */
  availability: string;
  createdAt: string;
}

export type CreateProductParams = Omit<Product, "productId" | "thumbnail" | "availability" | "createdAt">;

export interface UpdateProductParams extends CreateProductParams {
  productId: number;
}

export interface Category {
  slug: string;
  name: string;
}

/** Each category's icon, by its slug: for TypeBadge and wherever a category is picked. */
export const CATEGORY_ICONS: Partial<Record<string, LucideIcon>> = {
  "beauty": Sparkles,
  "fragrances": SprayCan,
  "furniture": Sofa,
  "groceries": ShoppingBasket,
  "home-decoration": Lamp,
  "kitchen-accessories": CookingPot,
  "laptops": Laptop,
  "mens-shirts": Shirt,
  "mens-shoes": Footprints,
  "mens-watches": Watch,
  "mobile-accessories": Cable,
  "motorcycle": Bike,
  "skin-care": Droplets,
  "smartphones": Smartphone,
  "sports-accessories": Dumbbell,
  "sunglasses": Glasses,
  "tablets": Tablet,
  "tops": Shirt,
  "vehicle": Car,
  "womens-bags": ShoppingBag,
  "womens-dresses": Shirt,
  "womens-jewellery": Gem,
  "womens-shoes": Footprints,
  "womens-watches": Watch,
};
