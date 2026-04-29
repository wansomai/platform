// components/workspace/WorkspaceSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

interface WorkspaceSkeletonProps {
  showSidebar?: boolean;
  projectTitle?: string;
}

export function WorkspaceSkeleton({ showSidebar = true, projectTitle }: WorkspaceSkeletonProps) {
  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            {/* Project title if provided */}
            {projectTitle && (
              <div className="mb-6">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
            )}
            
            {/* Chat Messages Skeleton */}
            <div className="space-y-6">
              {/* User message */}
              <div className="flex justify-end">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2 justify-end">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-16 w-80 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* AI response */}
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[90%]">
                  <div className="flex flex-col space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Another user message */}
              <div className="flex justify-end">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2 justify-end">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-12 w-60 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Loading AI response */}
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[90%]">
                  <div className="flex flex-col space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4 animate-pulse" />
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Chat Input Skeleton */}
        <div className="border-t bg-white p-4">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>

      {/* Sidebar Skeleton */}
      {showSidebar && (
        <div className="w-80 border-l bg-white">
          {/* Sidebar Header */}
          <div className="border-b p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-6" />
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="p-4 space-y-6">
            {/* Instructions Section */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* Jurisdiction Section */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>

            {/* Documents Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-8 w-full" />
              
              {/* Document items */}
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <Skeleton className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}