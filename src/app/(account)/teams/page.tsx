"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Building, 
  Plus, 
  RefreshCw, 
  Loader2,
  ArrowRightCircle,
  Check,
  LogOut
} from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from "@/hooks/useNotifications"
import { apiService } from "@/lib/api"

interface Organization {
  id: string
  name: string
  role: string
  isActive: boolean
  joinedAt?: string
}

export default function OrganizationsPage() {
  const { data: session, update } = useSession()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  
  const { notify } = useNotifications()
  
  // Fetch user's organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!session?.user) return
      
      try {
        setIsLoading(true)
        const response = await apiService.get<{ data: Organization[] }>('/api/organization')
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
      await apiService.post('/api/organization/switch', { organizationId })
      
      // Update the session to reflect the change
      await update() // This will trigger a session update
      
      // Show success notification
      notify.success("Organization switched successfully")
      
      // Update the local state
      setOrganizations(orgs => orgs.map(org => ({
        ...org,
        isActive: org.id === organizationId
      })))
    } catch (error: any) {
      console.error("Error switching organization:", error)
      notify.error(error.message || "Failed to switch organization")
    } finally {
      setIsSwitching(false)
    }
  }
  
  // Create a new organization
  const handleCreateOrganization = async () => {
    if (!newOrgName.trim() || isCreating) return
    
    setIsCreating(true)
    
    try {
      const response = await apiService.post<{ data: Organization }>('/api/organization', {
        name: newOrgName.trim()
      })
      
      // Add the new organization to the list
      setOrganizations([...organizations, response.data])
      
      // Reset form
      setNewOrgName("")
      setShowCreateDialog(false)
      
      // Show success notification
      notify.success("Organization created successfully")
    } catch (error: any) {
      console.error("Error creating organization:", error)
      notify.error(error.message || "Failed to create organization")
    } finally {
      setIsCreating(false)
    }
  }
  
  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }
  
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organization memberships
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Organization
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            You can be a member of multiple organizations and switch between them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : organizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeColor(org.role)}>
                        {org.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {org.joinedAt && formatDistanceToNow(new Date(org.joinedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {org.isActive ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {org.isActive ? (
                        <Button variant="outline" size="sm" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Current
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSwitchOrganization(org.id)}
                          disabled={isSwitching}
                        >
                          {isSwitching ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ArrowRightCircle className="h-4 w-4 mr-2" />
                          )}
                          Switch to
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-2 text-lg font-medium">No organizations</h3>
              <p className="text-sm text-muted-foreground">
                Create a new organization or accept an invitation to join one.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                New Organization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Organization Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization where you'll be the owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="org-name" className="text-sm font-medium">
                Organization Name
              </label>
              <Input
                id="org-name"
                placeholder="My Organization"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrganization} disabled={!newOrgName.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building className="h-4 w-4 mr-2" />
                  Create Organization
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}