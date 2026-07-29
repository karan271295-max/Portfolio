import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CommandPaletteProvider } from "@/components/shell/command-palette";
import { NewEntryProvider } from "@/components/entry/new-entry-provider";
import { ReminderBanner } from "@/components/entry/reminder-banner";
import { PortfolioProvider } from "@/lib/store";
import { PrivacyProvider } from "@/lib/privacy";
import { loadPortfolio } from "@/lib/repository";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { snapshots, liabilities, history } = await loadPortfolio();

  return (
    <PortfolioProvider initial={{ snapshots, liabilities, history }} persist>
      <PrivacyProvider>
        <NewEntryProvider>
          <CommandPaletteProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Topbar />
                <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 pb-24 md:px-6 lg:px-8 lg:pb-6">
                  <ReminderBanner />
                  {children}
                </main>
              </div>
              <MobileNav />
            </div>
          </CommandPaletteProvider>
        </NewEntryProvider>
      </PrivacyProvider>
    </PortfolioProvider>
  );
}
