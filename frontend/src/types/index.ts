export interface TransactionItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface Transaction {
  id: string;
  dashboardId: string;
  date: string | Date;
  entryType: 'Receita' | 'Despesa';
  flowType: 'Fixa' | 'Variável';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  institution?: string;
  cardBrand?: string;
  installmentTotal: number;
  installmentNumber: number;
  installmentStatus: 'N/A' | 'Paga' | 'Pendente';
  notes?: string;
  isTemporary: boolean;
  isThirdParty?: boolean;
  thirdPartyName?: string;
  thirdPartyDescription?: string;
  items?: TransactionItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  entryType?: string;
  flowType?: string;
  category?: string;
  institution?: string;
  installmentStatus?: string;
  search?: string;
  minAmount?: string;
  dashboardId?: string;
  ownership?: 'all' | 'client' | 'thirdParty';
  accountId?: string;
}

export interface StatsSummary {
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  savingsRate: number;
  transactionCount: number;
}

export interface InstitutionMeta {
  label: string;
  short: string;
  icon: string;
  bg: string;
  border: string;
  text: string;
}

export interface CardBrandMeta {
  label: string;
  icon: string;
  bg: string;
  border: string;
  text: string;
}
export interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  institution?: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  availableBalance: number;
  creditLimit?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  isPrimary: boolean;
  color?: string;
  icon?: string;
  description?: string;
  userId: string;
  closingDay?: number;
  dueDay?: number;
  createdAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'Receita' | 'Despesa';
  icon?: string;
  color?: string;
  parentId?: string;
  isSystem: boolean;
  isActive: boolean;
  order: number;
}
