export interface BankAccount {
  _id: string;
  company: { _id: string; name: string };
  bank: { _id: string; name: string };
  accountNumber: string;
  clabe: string;
  branch: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
