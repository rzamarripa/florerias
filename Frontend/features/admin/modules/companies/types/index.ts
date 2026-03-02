export interface Company {
  _id: string;
  legalName: string;
  tradeName?: string;
  rfc: string;
  legalForm: string;
  fiscalAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  administrator?: {
    _id: string;
    username: string;
    email: string;
    phone: string;
    profile: {
      name: string;
      lastName: string;
      fullName: string;
    };
  };
  redes?: {
    _id: string;
    username: string;
    email: string;
    phone: string;
    profile: {
      name: string;
      lastName: string;
      fullName: string;
    };
  }[];
  branches?: string[];
  logoUrl?: string | null;
  logoPath?: string | null;
  isFranchise?: boolean;
  activeWhatsApp?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyData {
  legalName?: string;
  tradeName?: string;
  rfc?: string;
  legalForm?: string;
  fiscalAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  primaryContact?: {
    name: string;
    email: string;
    phone: string;
  };
  administratorId?: string;
  administratorData?: {
    username: string;
    email: string;
    phone: string;
    password: string;
    profile: {
      name: string;
      lastName: string;
    };
  };
  redesIds?: string[];
  redesUserData?: {
    username: string;
    email: string;
    phone: string;
    password: string;
    profile: {
      name: string;
      lastName: string;
    };
  };
  logoUrl?: string | null;
  logoPath?: string | null;
  isFranchise?: boolean;
  activeWhatsApp?: boolean;
}

export interface Distributor {
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

export interface RedesUser {
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

export type WhatsAppVertical =
  | "Retail"
  | "Servicios"
  | "Restaurantes"
  | "Educacion"
  | "Salud"
  | "Tecnologia"
  | "Otro";

export interface WhatsappCompanyConfig {
  _id: string;
  companyId: string;
  adminId: string;
  legalName: string;
  website?: string;
  businessCountry: string;
  businessAddress: string;
  vertical: WhatsAppVertical;
  contactName: string;
  contactEmail: string;
  facebookAccount?: string;
  phoneNumber: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertWhatsappConfigData {
  legalName: string;
  website?: string;
  businessCountry: string;
  businessAddress: string;
  vertical: WhatsAppVertical;
  contactName: string;
  contactEmail: string;
  facebookAccount?: string;
  phoneNumber: string;
  displayName: string;
}
