'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"
import { useProjectStore } from '@/store/project.store'
import { useSession } from 'next-auth/react'
import { useNotifications } from '@/hooks/useNotifications'
import { apiService } from '@/lib/api'
<<<<<<< HEAD
=======
import ProAccessModal from '@/components/modals/ProAccess'
>>>>>>> 7689cf7ff27497642785d905be930cdafef21e31

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
<<<<<<< HEAD
=======
  const [showProAccess, setShowProAccess] = useState(false)
  const [isRequestingPro, setIsRequestingPro] = useState(false)
>>>>>>> 7689cf7ff27497642785d905be930cdafef21e31
  const [activeOrganizationId, setActiveOrganizationId] = useState<string>('')

  const { notify } = useNotifications()
  const { createProject, requiresUpgrade } = useProjectStore()
  const { data: session } = useSession()

  // Fetch the user's active organization when modal opens
  useEffect(() => {
    if (open) {
      fetchActiveOrganization()
    }
  }, [open])

  const fetchActiveOrganization = async () => {
    try {
      const response = await apiService.get('/api/profile') as {
        user: {
          activeOrganizationId: string | null
          organizationId: string
          activeOrganization?: { id: string }
        }
      }
      // Use activeOrganizationId if set, otherwise use organizationId
      const orgId = response.user.activeOrganizationId || response.user.organizationId
      setActiveOrganizationId(orgId)
    } catch (error) {
      console.error('Failed to fetch active organization:', error)
      // Fallback to session organization if profile fetch fails
      if (session?.user?.organization?.id) {
        setActiveOrganizationId(session.user.organization.id)
      }
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    if (!activeOrganizationId) {
<<<<<<< HEAD
      setError('Organization ID not found. Please try again.')
=======
      setError('Organization ID not found')
>>>>>>> 7689cf7ff27497642785d905be930cdafef21e31
      setIsLoading(false)
      return
    }

    try {
      const result = await createProject({
        ...formData,
        organizationId: activeOrganizationId
      })

      if (result) {
        notify.success('Project created successfully')
        onClose()
        setFormData({ title: '', description: '' })
      }
      // If result is null, check if it's due to subscription limits
      else if (requiresUpgrade) {
        setShowProAccess(true)
      }
      else {
        setError('Failed to create project. Please try again.')
      }
    } catch (error: any) {
      // Check if this is a subscription limit error
      if (error.status === 403 && error.requiresUpgrade) {
        setShowProAccess(true)
      } else {
        notify.error('Failed to create project. Please try again.')
        setError(error.message || 'Failed to create project. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Pro access request
  const handleRequestProAccess = async (formData: { name: string; email: string; accountType: string }) => {
    setIsRequestingPro(true);
    try {
      const response = await fetch('/api/prorequests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          account_type: formData.accountType,
          request_type: 'project_limit'
        })
      });

      await response.json();
      setShowProAccess(false);
      notify.success('Pro access request submitted successfully');
    } catch (error) {
      setIsRequestingPro(false);
      setShowProAccess(false);
      notify.error('Failed to submit Pro access request');
    } finally {
      setIsRequestingPro(false);
      setShowProAccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Project Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize project documents and conversations.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Project Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="col-span-3"
              placeholder="Enter project title"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="md:col-span-3"
              placeholder="Enter project description (optional)"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.title.trim()}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Workspace'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Pro Access Modal */}
      <ProAccessModal
        isOpen={showProAccess}
        onClose={() => setShowProAccess(false)}
        onRequestAccess={handleRequestProAccess}
        isLoading={isRequestingPro}
        errorMessage="You have reached your project limit (1 project for free plan). Request Pro access to create unlimited projects."
        userData={{
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          accountType: 'personal' // Default to personal, user can change
        }}
      />
    </Dialog>
  );
}

export default CreateProjectModal