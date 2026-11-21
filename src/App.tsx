import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Card,
  Col,
  Progress,
  Row,
  Statistic,
  Tag,
  Typography,
  Button,
} from "antd";

import {
  ShieldCheck,
  CalendarDays,
  UserRound,
  Wallet,
  Coins,
  CalendarCheck,
  Calculator,
  CheckCircle2,
  FileText,
} from "lucide-react";

import dayjs from "dayjs";

import { initialPolicy } from "./data/initialData";

import {
  buildTimeline,
  calculateSummary,
  formatINR,
  formatMonth,
  STORAGE_KEY,
} from "./utils/insurance";

import type { Policy } from "./types";

const { Title, Text } = Typography;

const POLICY_PDF_URL = "/documents/MaxLife_Policy.pdf";

function loadPolicy(): Policy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw) as Policy;

      if (parsed?.historicalPayments && parsed?.policyNumber) {
        return parsed;
      }
    }
  } catch {
    // Fall back to initial data.
  }

  return initialPolicy;
}

export default function App() {
  const [policy] = useState<Policy>(loadPolicy);

  const today = dayjs();

  const summary = useMemo(
    () => calculateSummary(policy, today),
    [policy, today.format("YYYY-MM-DD")]
  );

  const timeline = useMemo(
    () => buildTimeline(policy, today),
    [policy, today.format("YYYY-MM-DD")]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policy));
  }, [policy]);

  const recentPayments = [...policy.historicalPayments]
    .slice(-5)
    .reverse();

  const nextPaymentInDays = summary.nextPaymentDate
    ? Math.max(
        summary.nextPaymentDate.startOf("day").diff(today.startOf("day"), "day"),
        0
      )
    : null;

  const premiumCountdownText = nextPaymentInDays === null
    ? null
    : nextPaymentInDays === 0
      ? "Premium due today"
      : `Premium due in ${nextPaymentInDays} ${nextPaymentInDays === 1 ? "day" : "days"}`;

  return (
    <main className="page">
      {/* Header */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={25} />
          </div>

          <div>
            <Title level={3}>
              Insurance Premium Tracker
            </Title>

            <Text>Personal policy overview</Text>
          </div>
        </div>

        <Button
          className="today-chip policy-pdf-chip"
          type="text"
          href={POLICY_PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Policy Document
        </Button>
      </header>

      {/* Policy Details */}
      <section className="policy-card">
        <div className="policy-logo">
          <div className="logo-flame">◆</div>

          <div className="logo-max">
            MAX
            <br />
            <span>LIFE</span>
          </div>

          <small>INSURANCE</small>
        </div>

        <div className="policy-main">
          <div className="policy-title-row">
            <div>
              <Text className="eyebrow">
                TERM INSURANCE POLICY
              </Text>

              <Title level={3}>
                {policy.planName}
              </Title>

              <Text className="policy-number">
                Policy Number:{" "}
                <strong>{policy.policyNumber}</strong>
              </Text>
            </div>
          </div>

          <div className="policy-facts">
            <Fact
              icon={<ShieldCheck />}
              label="Cover Amount"
              value={formatINR(policy.coverAmount)}
            />

            <Fact
              icon={<CalendarDays />}
              label="Policy Term"
              value={`${policy.policyTermYears} Years`}
            />

            <Fact
              icon={<Coins />}
              label="Payment Term"
              value={`${policy.paymentTermYears} Years`}
            />

            <Fact
              icon={<UserRound />}
              label="Nominee"
              value={policy.nominee}
            />
          </div>
        </div>
      </section>

      {/* Premium Summary */}
      <Row gutter={[14, 14]} className="stats-grid">
        <Col xs={24} sm={12} xl={6}>
          <MetricCard
            className="green"
            icon={<Wallet />}
            title="Total Premium Paid"
            value={summary.projectedPaid}
          />
        </Col>

        <Col xs={12} sm={12} xl={6}>
          <MetricCard
            className="blue"
            icon={<CalendarCheck />}
            title="Payments Completed"
            value={summary.completedMonths}
            suffix="Months"
          />
        </Col>

        <Col xs={12} sm={12} xl={6}>
          <MetricCard
            className="orange"
            icon={<CalendarDays />}
            title="Remaining Months"
            value={summary.remainingMonths}
            suffix="Months"
          />
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <MetricCard
            className="red"
            icon={<Coins />}
            title="Remaining Balance"
            value={summary.remainingBalance}
          />
        </Col>
      </Row>

      {/* Payment Progress */}
      <Card className="progress-card">
        <div className="progress-layout">
          <div className="progress-ring">
            <Progress
              type="circle"
              percent={summary.progress}
              size={126}
              strokeWidth={10}
              strokeColor="#16a34a"
              trailColor="#e5eaf1"
              format={(percent) => (
                <strong>
                  {Math.round(percent ?? 0)}%
                </strong>
              )}
            />

            <Text>Completed</Text>
          </div>

          <div className="progress-info">
            <Title level={3}>
              Payment Progress
            </Title>

            <Title level={4}>
              {summary.completedMonths} of{" "}
              {summary.totalMonths} monthly payments
            </Title>

            <Progress
              percent={summary.progress}
              showInfo={false}
              strokeColor="#16a34a"
              trailColor="#e5eaf1"
            />

            <div className="progress-subline">
              <span>
                <Text type="secondary">
                  Monthly premium
                </Text>

                <strong>
                  {formatINR(policy.monthlyPremium)}
                </strong>
              </span>

              <span>
                <Text type="secondary">
                  Actual historical premiums
                </Text>

                <strong>
                  {formatINR(summary.actualPaid)}
                </strong>
              </span>
            </div>
          </div>

          <div className="balance-side">
            <div>
              <Calculator />

              <span>
                <Text type="secondary">
                  Projected total premium
                </Text>

                <strong>
                  {formatINR(
                    summary.projectedPaid +
                    summary.remainingBalance
                  )}
                </strong>
              </span>
            </div>

            <div>
              <CalendarDays />

              <span>
                <Text type="secondary">
                  Next payment date
                </Text>

                <strong>
                  {summary.nextPaymentDate?.format(
                    "DD MMM YYYY"
                  ) ?? "Completed"}
                </strong>

                {premiumCountdownText ? (
                  <small className="payment-countdown">
                    {premiumCountdownText}
                  </small>
                ) : null}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Timeline */}
      <Card
        className="timeline-card"
        title={
          <span className="section-title">
            <CalendarCheck />
            Payment Timeline
          </span>
        }
      >
        <div className="timeline">
          <TimelinePoint
            title="First Payment"
            date={dayjs(`${policy.startMonth}-01`)
              .date(policy.paymentDay)
              .format("DD MMM YYYY")}
            status="done"
          />

          <TimelinePoint
            title="Latest Historical Payment"
            date={formatMonth(policy.historyThrough)}
            status="done"
          />

          <TimelinePoint
            title="Next Payment"
            date={
              summary.nextPaymentDate?.format(
                "DD MMM YYYY"
              ) ?? "Payment term complete"
            }
            status="next"
          />

          <TimelinePoint
            title="Final Payment"
            date={summary.finalPaymentDate.format(
              "DD MMM YYYY"
            )}
            status="future"
          />
        </div>
      </Card>

      {/* Recent Payments */}
      <Card
        className="recent-card"
        title="Recent Historical Payments"
      >
        <div className="recent-list">
          {recentPayments.map((payment) => (
            <div
              className="recent-row"
              key={payment.month}
            >
              <div>
                <strong>
                  {formatMonth(payment.month)}
                </strong>

              </div>

              <strong>
                {formatINR(payment.amount)}
              </strong>

              <Tag color="success">
                Recorded
              </Tag>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}

/* Policy Information Item */
function Fact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="fact">
      <span className="fact-icon">
        {icon}
      </span>

      <span>
        <Text>{label}</Text>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

/* Premium Summary Card */
function MetricCard({
  icon,
  title,
  value,
  suffix,
  className,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  suffix?: string;
  className: string;
}) {
  const isMoney = !suffix;

  return (
    <Card className={`metric-card ${className}`}>
      <div className="metric-icon">
        {icon}
      </div>

      <div className="metric-copy">
        <Text>{title}</Text>

        <Statistic
          value={value}
          precision={isMoney ? 2 : 0}
          prefix={isMoney ? "₹" : undefined}
          suffix={suffix}
          formatter={isMoney
            ? (number) => new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(Number(number))
            : undefined}
        />
      </div>
    </Card>
  );
}

/* Payment Timeline Item */
function TimelinePoint({
  title,
  date,
  status,
}: {
  title: string;
  date: string;
  status: "done" | "next" | "future";
}) {
  return (
    <div className={`timeline-point ${status}`}>
      <div className="point-dot">
        {status === "done" ? (
          <CheckCircle2 size={18} />
        ) : null}
      </div>

      <strong>{title}</strong>

      <span>{date}</span>

      <small>
        {status === "done"
          ? "Recorded"
          : status === "next"
            ? "Upcoming"
            : "Planned"}
      </small>
    </div>
  );
}
