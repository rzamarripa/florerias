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
