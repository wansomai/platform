"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  UserPlus,
  MoreHorizontal,
  Mail,
  Phone,
  Briefcase,
  UserX,
  UserCog,
  XCircle
} from "lucide-react"
import { useProjectStore, TeamMember } from "@/store/project.store"
import { useUIStore } from "@/store/ui.store"

export function Team() {
  const params = useParams()
  const projectId = params.id as string
  
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { currentProject, addTeamMember, removeTeamMember, isLoading } = useProjectStore()
  const { addToast } = useUIStore()
  
  // Get team members from current project
  const teamMembers = currentProject?.knowledge_base?.team || []
  
  // Handle adding a team member
  const handleAddMember = async () => {
    if (!email.trim()) return
    
    setIsSubmitting(true)
    
    try {
      await addTeamMember(projectId, { email, role })
      
      addToast({
        message: `Invitation sent to ${email}`,
        type: "success"
      })
      
      setShowAddMemberDialog(false)
      setEmail("")
      setRole("member")
    } catch (error) {
      addToast({
        message: "Failed to add team member",
        type: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle removing a team member
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      await removeTeamMember(projectId, memberId)
      
      addToast({
        message: `${memberName} has been removed from the team`,
        type: "success"
      })
    } catch (error) {
      addToast({
        message: "Failed to remove team member",
        type: "error"
      })
    }
  }
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }
  
  // Get role display name
  const getRoleLabel = (roleValue: string) => {
    switch (roleValue) {
      case 'owner':
        return 'Owner'
      case 'admin':
        return 'Administrator'
      case 'member':
        return 'Team Member'
      case 'viewer':
        return 'Viewer'
      default:
        return roleValue
    }
  }
  
  // Get role color
  const getRoleColor = (roleValue: string) => {
    switch (roleValue) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'member':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Members</h2>
        <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Invite a new member to join this project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="member">Team Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddMemberDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddMember} 
                disabled={!email.trim() || isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-8">
            <UserPlus className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No team members yet</h3>
            <p className="text-gray-500 mb-4">Add team members to collaborate on this project.</p>
            <Button
              onClick={() => setShowAddMemberDialog(true)}
              variant="outline"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add Team Member
            </Button>
          </div>
        ) : (
          teamMembers.map((member: TeamMember) => (
            <Card key={member.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={member.avatar_url} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      <CardDescription className="text-sm">{member.email}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Email</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>Change role</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        <span>Remove</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="pt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {getRoleLabel(member.role)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}