import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPaletteProvider } from "@/components/shell/command-palette";
import { PortfolioProvider } from "@/lib/store";
import { loadPortfolio } from "@/lib/repository";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { holdings, liabilities, transactions, history } = await loadPortfolio();

  return (
    <PortfolioProvider
      initial={{ holdings, liabilities, transactions, history }}
      persist
    >
      <CommandPaletteProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </PortfolioProvider>
  );
}
