import { PageStub } from "@/components/shell/page-stub";

export default function SettingsPage() {
  return (
    <PageStub
      title="Settings"
      points={[
        "Profile, base currency, monthly expense baseline",
        "2FA, biometric unlock, session management",
        "Notification preferences (daily / weekly / monthly summaries)",
        "Data export, backups and account deletion",
      ]}
    />
  );
}
