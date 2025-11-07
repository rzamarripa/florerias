export interface Provider {
  _id: string;
  contactName: string;
  tradeName: string;
  legalName: string;
  rfc: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  email: string;
  company: {
    _id: string;
    legalName: string;
    tradeName?: string;
    rfc: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderData {
  contactName: string;
  tradeName: string;
  legalName: string;
  rfc: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  email: string;
  company: string;
}

export interface UpdateProviderData extends CreateProviderData {}
