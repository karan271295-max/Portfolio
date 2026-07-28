// Seed from the imported statement (23 Jul 2026). Five accounts only — InCred and
// WazirX from the original export are intentionally excluded. Finance math is real.
import type { HistoryPoint, Liability, Snapshot } from "./types";

export const demoLiabilities: Liability[] = [];

// Latest full per-account entry. New entries are added via the + button.
export const demoSnapshots: Snapshot[] = [
  {
    id: "seed-2026-07-23",
    date: "2026-07-23",
    accounts: {
      kite: { invested: 3043848, current: 3195290 },
      coin: { invested: 573048, current: 678977 },
      mfcentral: { invested: 1383000, current: 1788000 },
      indmoney: { invested: 309893, current: 394258 },
      cash: { invested: 250000, current: 250000 },
    },
  },
];

// Portfolio value + cost basis over time (drives the chart and XIRR). Last point
// matches the five-account seed total (₹63.06L), earlier points are the raw record.
export const demoHistory: HistoryPoint[] = [
  { date: "2024-01-04", value: 1744595, invested: 1250444 },
  { date: "2024-01-16", value: 1865776, invested: 1335883 },
  { date: "2024-01-29", value: 2170061, invested: 1659164 },
  { date: "2024-02-15", value: 2226585, invested: 1679083 },
  { date: "2024-03-02", value: 2284176, invested: 1724904 },
  { date: "2024-03-11", value: 2295917, invested: 1751082 },
  { date: "2024-04-02", value: 2391793, invested: 1870414 },
  { date: "2024-04-24", value: 2441582, invested: 1891130 },
  { date: "2024-05-21", value: 2511352, invested: 1908129 },
  { date: "2024-06-21", value: 2627070, invested: 2033691 },
  { date: "2024-09-21", value: 2939095, invested: 2139795 },
  { date: "2024-10-21", value: 2970416, invested: 2283178 },
  { date: "2024-11-21", value: 3117014, invested: 2575235 },
  { date: "2024-12-21", value: 3232780, invested: 2635084 },
  { date: "2025-01-21", value: 3184199, invested: 2679369 },
  { date: "2025-02-21", value: 3138978, invested: 2720708 },
  { date: "2025-03-24", value: 3330411, invested: 2837568 },
  { date: "2025-04-21", value: 3427234, invested: 2800645 },
  { date: "2025-05-21", value: 4662440, invested: 4058381 },
  { date: "2026-02-05", value: 5405302, invested: 4672893 },
  { date: "2026-03-29", value: 5524983, invested: 5307946 },
  { date: "2026-04-29", value: 5855034, invested: 5370375 },
  { date: "2026-05-23", value: 5505135, invested: 4793650 },
  { date: "2026-07-23", value: 6306525, invested: 5559789 },
];
