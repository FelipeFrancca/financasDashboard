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
