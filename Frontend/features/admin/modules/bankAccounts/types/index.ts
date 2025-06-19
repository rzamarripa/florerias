export interface BankAccount {
  _id: string;
  company: { _id: string; name: string };
  bank: { _id: string; name: string };
  accountNumber: string;
  clabe: string;
  branch?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
