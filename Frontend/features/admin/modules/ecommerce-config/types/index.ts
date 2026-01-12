export interface TopbarItem {
  name: string;
  link: string;
  order?: number;
}

export interface EcommerceConfigHeader {
  pageTitle?: string;
  logoUrl?: string;
  logoPath?: string;
  topbar?: TopbarItem[];
}

export interface EcommerceConfigColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface EcommerceConfigTypography {
  titleFont: string;
  titleSize: number;
  textFont: string;
  subtitleSize: number;
  normalSize: number;
}

export interface DeliverySettings {
  enabled: boolean;
  time: string;
  availableFrom: string;
  availableTo: string;
}

export interface CarouselImage {
  url: string;
  path: string;
}

export interface PromotionItem {
  name: string;
  text?: string;
  expirationDate?: string;
  createdAt?: string;
}

export interface EcommerceConfigFeaturedElements {
  banner?: {
    enabled: boolean;
    title?: string;
    text?: string;
    imageUrl?: string;
    imagePath?: string;
    button?: {
      name: string;
      link: string;
    };
  };
  carousel?: {
    enabled: boolean;
    images: CarouselImage[];
  };
  delivery?: {
    pickup: DeliverySettings;
    delivery: DeliverySettings;
  };
  promotions?: {
    enabled: boolean;
    items?: PromotionItem[];
  };
  productCatalog?: {
    enabled: boolean;
    display?: string;
    productsPerPage?: number;
    showFilters?: boolean;
    showCategories?: boolean;
    showSearch?: boolean;
    showSort?: boolean;
  };
}

export interface StockItem {
  _id: string;
  productId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  imagen?: string;
  productCategory?: string | any;
  originalPrice?: number;
  discountPercentage?: number;
}

export interface EcommerceConfig {
  _id: string;
  companyId: string | any;
  branchId: string | any;
  header?: EcommerceConfigHeader;
  template?: 'classic' | 'modern' | 'minimalist' | 'elegant';
  colors?: EcommerceConfigColors;
  typography?: EcommerceConfigTypography;
  featuredElements?: EcommerceConfigFeaturedElements;
  itemsStock?: StockItem[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagerConfigResponse {
  success: boolean;
  data: {
    config: EcommerceConfig | null;
    branch: any;
    companyId: string;
  };
}