import { useAuthStore } from "@/store/auth.store"

  // src/components/layout/Navbar.tsx
  export const Navbar = () => {
    const user = useAuthStore((state) => state.user)
  
    return (
      <nav className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img className="h-8 w-auto" src="/logo.svg" alt="WakiliChat" />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/dashboard"
                  className="border-primary-500 text-secondary-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="/projects"
                  className="border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Projects
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button
                  type="button"
                  className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  New Project
                </button>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                <div className="ml-3 relative">
                  <div className="flex items-center space-x-3">
                    <span className="text-secondary-700">{user?.fullName}</span>
                    <button
                      onClick={() => useAuthStore.getState().logout()}
                      className="text-secondary-600 hover:text-secondary-900"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }