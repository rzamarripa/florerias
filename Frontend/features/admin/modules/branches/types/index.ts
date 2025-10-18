export interface BranchAddress {
  street: string;
  externalNumber: string;
  internalNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface Manager {
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

export interface Employee {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
  };
  role: {
    _id: string;
    name: string;
  };
}

export interface Company {
  _id: string;
  legalName: string;
  tradeName?: string;
  rfc: string;
}

export interface Branch {
  _id: string;
  branchName: string;
  branchCode?: string;
  companyId: Company | string;
  address: BranchAddress;
  manager: Manager | string;
  contactPhone: string;
  contactEmail: string;
  employees: Employee[] | string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerData {
  username: string;
  email: string;
  phone: string;
  password: string;
  profile: {
    name: string;
    lastName: string;
  };
}

export interface EmployeeData {
  username: string;
  email: string;
  phone: string;
  password: string;
  profile: {
    name: string;
    lastName: string;
  };
}

export interface CreateBranchData {
  branchName: string;
  branchCode?: string;
  companyId: string;
  address: BranchAddress;
  managerId?: string;
  managerData?: ManagerData;
  contactPhone: string;
  contactEmail: string;
  employees?: string[];
  employeesData?: EmployeeData[];
}
