export interface StorageAddress {
  street: string;
  externalNumber: string;
  internalNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface WarehouseManager {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
  };
}

export interface Product {
  _id: string;
  nombre: string;
  unidad: string;
  descripcion?: string;
  imagen?: string;
  totalCosto?: number;
  totalVenta?: number;
}

export interface ProductItem {
  _id: string;
  productId: Product | string;
  quantity: number;
}

export interface Branch {
  _id: string;
  branchName: string;
  branchCode?: string;
  address?: StorageAddress;
  contactPhone?: string;
  contactEmail?: string;
}

export interface Storage {
  _id: string;
  branch: Branch | string;
  warehouseManager: WarehouseManager | string;
  products: ProductItem[];
  lastIncome: string | null;
  lastOutcome: string | null;
  address: StorageAddress;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStorageData {
  branch: string;
  warehouseManager: string;
  products?: {
    productId: string;
    quantity: number;
  }[];
  address: StorageAddress;
}

export interface UpdateStorageData {
  warehouseManager?: string;
  address?: StorageAddress;
}

export interface AddProductsData {
  products: {
    productId: string;
    quantity: number;
  }[];
}

export interface RemoveProductsData {
  products: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateProductQuantityData {
  productId: string;
  quantity: number;
}
