import { PageStub } from "@/components/shell/page-stub";

export default function ImportPage() {
  return (
    <PageStub
      title="Import Center"
      points={[
        "CSV, Excel, PDF, broker statements, bank statements, Mutual Fund CAS",
        "Auto file-type detection, parsing and column mapping",
        "Preview before import with duplicate detection",
        "Import only new transactions · full audit log",
      ]}
    />
  );
}
