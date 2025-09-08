'use client'

import { useState } from 'react'
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
  
  const { notify } = useNotifications()
  const { createProject } = useProjectStore()
  const { data: session } = useSession()

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    if (!session?.user?.organization?.id) {
      setError('Organization ID not found')
      setIsLoading(false)
      return
    }

    try {
      await createProject({
        ...formData,
        organizationId: session.user.organization.id
      })

      notify.success('Project created successfully')
      onClose()
      setFormData({ title: '', description: '' })
    } catch (error: any) {
      notify.error('Failed to create project. Please try again.')
      setError(error.message || 'Failed to create project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
    </Dialog>
  );
}

export default CreateProjectModal