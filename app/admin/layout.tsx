import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin – Kathputli Colony Complaints",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-slate-50 text-[15px]">{children}</div>;
}
