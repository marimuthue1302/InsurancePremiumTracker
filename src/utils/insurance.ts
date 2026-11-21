import dayjs, { type Dayjs } from "dayjs";
import type { Policy } from "../types";

export const STORAGE_KEY = "insurance-premium-tracker-ts-v1";

export const formatINR = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

export const formatMonth = (month: string): string =>
  dayjs(`${month}-01`).format("MMM YYYY");

export const getTermMonths = (policy: Policy): number =>
  policy.paymentTermYears * 12;

export function getLastDueMonth(today: Dayjs, policy: Policy): string {
  const dueThisMonth = today.date() >= policy.paymentDay;
  const dueDate = dueThisMonth
    ? today
    : today.subtract(1, "month");
  return dueDate.format("YYYY-MM");
}

export interface PaymentSummary {
  totalMonths: number;
  completedMonths: number;
  remainingMonths: number;
  actualPaid: number;
  projectedPaid: number;
  remainingBalance: number;
  progress: number;
  nextPaymentDate: Dayjs | null;
  finalPaymentDate: Dayjs;
  futureProjectedMonths: number;
}

export function calculateSummary(policy: Policy, today: Dayjs): PaymentSummary {
  const totalMonths = getTermMonths(policy);
  const actualPaid = policy.historicalPayments.reduce(
    (sum, payment) => sum + payment.amount, 0
  );

  // Historical payments are counted exactly as supplied. From the month after
  // historyThrough, instalments are projected automatically after each 20th.
  const historyEnd = dayjs(`${policy.historyThrough}-01`).date(policy.paymentDay);
  const lastDueMonth = getLastDueMonth(today, policy);
  const lastDueDate = dayjs(`${lastDueMonth}-01`).date(policy.paymentDay);

  const elapsedSinceHistory = lastDueDate.isAfter(historyEnd, "month")
    ? Math.max(
        (lastDueDate.year() - historyEnd.year()) * 12 +
        lastDueDate.month() - historyEnd.month(),
        0
      )
    : 0;

  const historicalCount = policy.historicalPayments.length;
  const completedMonths = Math.min(historicalCount + elapsedSinceHistory, totalMonths);
  const futureProjectedMonths = Math.max(completedMonths - historicalCount, 0);
  const projectedPaid = actualPaid + futureProjectedMonths * policy.monthlyPremium;
  const remainingMonths = Math.max(totalMonths - completedMonths, 0);
  const remainingBalance = remainingMonths * policy.monthlyPremium;

  const startDate = dayjs(`${policy.startMonth}-01`).date(policy.paymentDay);
  const nextPaymentDate = completedMonths < totalMonths
    ? startDate.add(completedMonths, "month")
    : null;
  const finalPaymentDate = startDate.add(totalMonths - 1, "month");

  return {
    totalMonths,
    completedMonths,
    remainingMonths,
    actualPaid,
    projectedPaid,
    remainingBalance,
    progress: (completedMonths / totalMonths) * 100,
    nextPaymentDate,
    finalPaymentDate,
    futureProjectedMonths
  };
}

export interface TimelineItem {
  month: string;
  dueDate: Dayjs;
  amount: number;
  status: "historical" | "projected" | "upcoming";
}

export function buildTimeline(policy: Policy, today: Dayjs): TimelineItem[] {
  const history = new Map(
    policy.historicalPayments.map((payment) => [payment.month, payment.amount])
  );
  const startDate = dayjs(`${policy.startMonth}-01`).date(policy.paymentDay);
  const summary = calculateSummary(policy, today);

  return Array.from({ length: getTermMonths(policy) }, (_, index) => {
    const dueDate = startDate.add(index, "month");
    const month = dueDate.format("YYYY-MM");
    const historicalAmount = history.get(month);
    const isElapsed = index < summary.completedMonths;

    return {
      month,
      dueDate,
      amount: historicalAmount ?? policy.monthlyPremium,
      status: historicalAmount !== undefined
        ? "historical"
        : isElapsed ? "projected" : "upcoming"
    };
  });
}
