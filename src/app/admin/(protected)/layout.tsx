import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-theme flex min-h-screen flex-col bg-[#050505] text-white lg:flex-row">
      <AdminSidebar />
      <main className="admin-main mx-auto w-full max-w-[1660px] min-w-0 flex-1 overflow-x-auto px-6 py-8 sm:px-10 sm:py-12 xl:px-14">{children}</main>
    </div>
  );
}
