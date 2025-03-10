// app/dashboard/layout.tsx
import { ReactNode } from "react";
import DashboardLayoutComponent from "@/components/layout/DashboardLayout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>;
}