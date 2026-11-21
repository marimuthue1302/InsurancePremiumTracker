export interface PaymentRecord {
  month: string; // YYYY-MM
  amount: number;
}

export interface Policy {
  policyNumber: string;
  planName: string;
  policyTermYears: number;
  paymentTermYears: number;
  coverAmount: number;
  nominee: string;
  monthlyPremium: number;
  paymentDay: number;
  startMonth: string;
  historyThrough: string;
  historicalPayments: PaymentRecord[];
}

export interface AppState {
  policy: Policy;
}
