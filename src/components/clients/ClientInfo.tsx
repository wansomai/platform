"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Briefcase,
  Building,
  Phone,
  Mail,
  MapPin,
  User,
  Edit,
  Save,
  Plus,
  Loader2,
} from "lucide-react"
import { useProjectStore, ClientInfo as ClientInfoType } from "@/store/project.store"
import { useUIStore } from "@/store/ui.store"

export function ClientInfo() {
  const params = useParams()
  const projectId = params.id as string
  
  const { currentProject, updateClientInfo, isLoading } = useProjectStore()
  const { addToast } = useUIStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [client, setClient] = useState<ClientInfoType>(
    currentProject?.knowledge_base?.client || {
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      notes: ""
    }
  )
  
  // Update client form data
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setClient(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Submit client information
  const handleSubmit = async () => {
    try {
      await updateClientInfo(projectId, client)
      setIsEditing(false)
      addToast({
        message: "Client information updated successfully",
        type: "success"
      })
    } catch (error) {
      addToast({
        message: "Failed to update client information",
        type: "error"
      })
    }
  }
  
  // Check if client info exists
  const hasClientInfo = currentProject?.knowledge_base?.client && 
                       Object.keys(currentProject.knowledge_base.client).length > 0 &&
                       currentProject.knowledge_base.client.name
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Client Information</h2>
        {hasClientInfo && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Client
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      {isLoading && !hasClientInfo && !isEditing ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : !hasClientInfo && !isEditing ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No client information</h3>
            <p className="text-gray-500 max-w-md text-center mb-6">
              Add your client's information to keep track of important details and maintain client records.
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Client Information
            </Button>
          </CardContent>
        </Card>
      ) : isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Enter your client's information for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Acme Corporation"
                  value={client.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  placeholder="John Doe"
                  value={client.contact_person || ""}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="client@example.com"
                  value={client.email || ""}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={client.phone || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="123 Main St, New York, NY 10001"
                value={client.address || ""}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional information about the client..."
                value={client.notes || ""}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !client.name}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 p-2 rounded-md">
                  <Building className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-gray-500">Company Name</p>
                </div>
              </div>
              
              {client.contact_person && (
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-md">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{client.contact_person}</p>
                    <p className="text-xs text-gray-500">Primary Contact</p>
                  </div>
                </div>
              )}
              
              {client.address && (
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 p-2 rounded-md">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{client.address}</p>
                    <p className="text-xs text-gray-500">Address</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3">
                  <div className="bg-purple-50 p-2 rounded-md">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{client.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
              )}
              
              {client.phone && (
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-50 p-2 rounded-md">
                    <Phone className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{client.phone}</p>
                    <p className="text-xs text-gray-500">Phone</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {client.notes || "No additional notes provided."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}