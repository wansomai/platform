"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { 
  Building, 
  ChevronDown, 
  Check, 
  Loader2,
  LogOut
} from "lucide-react"
import { apiService } from "@/lib/api"
import { useNotifications } from "@/hooks/useNotifications"

interface Organization {
  id: string
  name: string
  role: string
  isActive: boolean
}

export function OrganizationSwitcher() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  
  const { notify } = useNotifications()
  
  // Fetch user's organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!session?.user) return
      
      try {
        setIsLoading(true)
        const response = await apiService.get<{ data: Organization[] }>('/api/organizations')
        setOrganizations(response.data)
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrganizations()
  }, [session])
  
  // Switch to a different organization
  const handleSwitchOrganization = async (organizationId: string) => {
    if (isSwitching) return
    
    // If it's already the active organization, do nothing
    if (organizations.find(org => org.id === organizationId && org.isActive)) {
      return
    }
    
    setIsSwitching(true)
    
    try {
      await apiService.post('/api/organizations/switch', { organizationId })
      
      // Update the session to reflect the change
      await update() // This will trigger a session update
      
      // Show success notification
      notify.success("Organization switched successfully")
      
      // Refresh the page to reflect the new organization context
      router.refresh()
    } catch (error: any) {
      console.error("Error switching organization:", error)
      notify.error(error.message || "Failed to switch organization")
    } finally {
      setIsSwitching(false)
    }
  }
  
  // Get current organization
  const currentOrganization = organizations.find(org => org.isActive)
  
  // If user only has one organization, don't show the switcher
  if (organizations.length <= 1 && !isLoading) {
    return null
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-9 px-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building className="h-4 w-4" />
          )}
          <span className="max-w-[150px] truncate">
            {currentOrganization?.name || "Select Organization"}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => handleSwitchOrganization(org.id)}
            disabled={isSwitching}
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="truncate">{org.name}</span>
            </div>
            {org.isActive && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/teams')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Manage Organizations</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}