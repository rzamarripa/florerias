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
  distributor?: {
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyData {
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
  distributorId?: string;
  distributorData?: {
    username: string;
    email: string;
    phone: string;
    password: string;
    profile: {
      name: string;
      lastName: string;
    };
  };
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
