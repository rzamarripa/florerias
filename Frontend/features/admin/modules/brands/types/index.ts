export interface Brand {
  _id: string;
  logo?: LogoData;
  categoryId?:
    | {
        _id: string;
        name: string;
        description?: string;
      }
    | string; // Puede ser string (ID) o objeto populated
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  companies?: string[];
}

export interface Company {
  _id: string;
  name: string;
  legalRepresentative: string;
  rfc: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface LogoData {
  _id: string;
  contentType: string;
  data: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}
