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
import { useProfile, useOrganization } from '@/store/profile.store'
import { useSession } from 'next-auth/react'
import { useNotifications } from '@/hooks/useNotifications'
import ProAccessModal from '@/components/modals/ProAccess'
import { useRouter } from 'next/navigation'

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
  const [showProAccess, setShowProAccess] = useState(false)

  const { notify } = useNotifications()
  const { createProject, requiresUpgrade } = useProjectStore()
  const { user: profile, fetchProfile } = useProfile()
  const { isUpgrading, requestUpgrade, setUpgrading } = useOrganization()
  const { data: session } = useSession()
  const router = useRouter();

  // Fetch the user's active organization when modal opens
  useEffect(() => {
    if (open && !profile) {
      fetchProfile()
    }
  }, [open, profile, fetchProfile])

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    const organizationId = profile?.organizationId
    if (!organizationId) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
      return
    }

    try {
      const result = await createProject({
        ...formData,
        organizationId
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
  const handleRequestProAccess = async () => {
    setUpgrading(true);

    const success = await requestUpgrade();

    if (success) {
      notify.success('Pro access request submitted successfully');
      router.push('/profile');
    } else {
      notify.error('Failed to submit Pro access request');
    }

    setShowProAccess(false);
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
        isLoading={isUpgrading}
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