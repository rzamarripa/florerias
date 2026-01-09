export interface EcommerceConfigHeader {
  businessName?: string;
  logoUrl?: string;
  logoPath?: string;
  coverUrl?: string;
  coverPath?: string;
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
  deliveryTime: string;
  availableFrom: string;
  availableTo: string;
}

export interface CarouselImage {
  url: string;
  path: string;
}

export interface EcommerceConfigFeaturedElements {
  banner?: {
    enabled: boolean;
    imageUrl?: string;
    imagePath?: string;
    buttonText?: string;
  };
  carousel?: {
    enabled: boolean;
    images: CarouselImage[];
  };
  deliveryData?: {
    pickup: DeliverySettings;
    delivery: DeliverySettings;
  };
  featuredProducts?: {
    enabled: boolean;
    title: string;
    quantity: number;
  };
  promotions?: {
    enabled: boolean;
    quantity: number;
  };
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
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagerConfigResponse {
  config: EcommerceConfig;
  branch: any;
  companyId: string;
}