import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout"

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>
}