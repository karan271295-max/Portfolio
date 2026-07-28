import { PageStub } from "@/components/shell/page-stub";

export default function GoalsPage() {
  return (
    <PageStub
      title="Goals"
      points={[
        "Retirement, house, car, vacation, education, wedding, custom goals",
        "Target, current progress, projected date",
        "Required monthly investment to stay on track",
        "Monte-Carlo probability of success",
      ]}
    />
  );
}
