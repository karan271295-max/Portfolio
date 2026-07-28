import { PageStub } from "@/components/shell/page-stub";

export default function AnalyticsPage() {
  return (
    <PageStub
      title="Portfolio Analytics"
      points={[
        "Performance by sector, country, market cap, AMC, broker, account, goal",
        "Best / worst performers, realized vs unrealized gains",
        "Volatility, drawdown, rolling returns, benchmark comparison",
        "Inflation-adjusted returns and historical net worth",
      ]}
    />
  );
}
