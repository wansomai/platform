import { useState } from "react"
import { useParams } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Clock,
  Calendar as CalendarDate,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Edit,
  Trash2,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useProjectStore, EventInfo } from "@/store/project.store"
import { useUIStore } from "@/store/ui.store"

export function Schedule() {
  const params = useParams()
  const projectId = params.id as string
  
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null)
  
  // New event form state
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventType, setEventType] = useState("meeting")
  const [eventDescription, setEventDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { currentProject, addEvent, updateEvent, removeEvent, isLoading } = useProjectStore()
  const { addToast } = useUIStore()
  
  // Get events from current project
  const events = currentProject?.knowledge_base?.events || []
  
  // Filter events for the selected date
  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    return date && 
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
  })
  
  // Highlight dates with events
  const eventDates = events.map(event => new Date(event.date))
  
  // Add new event
  const handleAddEvent = async () => {
    if (!eventTitle || !eventDate || !eventType) return
    
    setIsSubmitting(true)
    
    try {
      await addEvent(projectId, {
        title: eventTitle,
        date: eventDate,
        type: eventType,
        description: eventDescription
      })
      
      addToast({
        message: "Event added successfully",
        type: "success"
      })
      
      // Reset form and close modal
      setEventTitle("")
      setEventDate("")
      setEventType("meeting")
      setEventDescription("")
      setShowAddEventModal(false)
    } catch (error) {
      addToast({
        message: "Failed to add event",
        type: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Edit event
  const handleEditEvent = async () => {
    if (!selectedEvent || !eventTitle || !eventDate || !eventType) return
    
    setIsSubmitting(true)
    
    try {
      await updateEvent(projectId, selectedEvent.id, {
        title: eventTitle,
        date: eventDate,
        type: eventType,
        description: eventDescription
      })
      
      addToast({
        message: "Event updated successfully",
        type: "success"
      })
      
      // Reset form and close modal
      setSelectedEvent(null)
      setEventTitle("")
      setEventDate("")
      setEventType("meeting")
      setEventDescription("")
      setShowEditEventModal(false)
    } catch (error) {
      addToast({
        message: "Failed to update event",
        type: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await removeEvent(projectId, eventId)
      
      addToast({
        message: "Event deleted successfully",
        type: "success"
      })
    } catch (error) {
      addToast({
        message: "Failed to delete event",
        type: "error"
      })
    }
  }
  
  // Open edit modal with event data
  const openEditModal = (event: EventInfo) => {
    setSelectedEvent(event)
    setEventTitle(event.title)
    setEventDate(event.date.split('T')[0]) // Format date for input
    setEventType(event.type)
    setEventDescription(event.description || "")
    setShowEditEventModal(true)
  }
  
  // Get event type icon
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Clock className="h-5 w-5" />
      case 'deadline':
        return <AlertTriangle className="h-5 w-5" />
      case 'court':
        return <FileText className="h-5 w-5" />
      default:
        return <CalendarDate className="h-5 w-5" />
    }
  }
  
  // Get event type background color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-50'
      case 'deadline':
        return 'bg-red-50'
      case 'court':
        return 'bg-purple-50'
      default:
        return 'bg-gray-50'
    }
  }
  
  // Get event type text color
  const getEventTypeTextColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'text-blue-600'
      case 'deadline':
        return 'text-red-600'
      case 'court':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }
  
  // Format event type label
  const getEventTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }
  
  // Check if a date has events
  const hasEventsOn = (day: Date) => {
    return eventDates.some(eventDate => 
      eventDate.getDate() === day.getDate() &&
      eventDate.getMonth() === day.getMonth() &&
      eventDate.getFullYear() === day.getFullYear()
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Schedule</h2>
        <Dialog open={showAddEventModal} onOpenChange={setShowAddEventModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
              <DialogDescription>
                Create a new event or deadline for this project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-title" className="text-right">
                  Title
                </Label>
                <Input
                  id="event-title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="col-span-3"
                  placeholder="Client Meeting"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-date" className="text-right">
                  Date
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-type" className="text-right">
                  Type
                </Label>
                <Select 
                  value={eventType} 
                  onValueChange={setEventType}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="court">Court</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="event-description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Details about the event..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddEventModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddEvent} 
                disabled={isSubmitting || !eventTitle || !eventDate || !eventType}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>Add Event</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Event Modal */}
        <Dialog open={showEditEventModal} onOpenChange={setShowEditEventModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the details of this event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-event-title" className="text-right">
                  Title
                </Label>
                <Input
                  id="edit-event-title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-event-date" className="text-right">
                  Date
                </Label>
                <Input
                  id="edit-event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-event-type" className="text-right">
                  Type
                </Label>
                <Select 
                  value={eventType} 
                  onValueChange={setEventType}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="court">Court</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-event-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-event-description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowEditEventModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditEvent} 
                disabled={isSubmitting || !eventTitle || !eventDate || !eventType}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
      
      {/* All upcoming events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-6">
              <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500 mb-4">No events scheduled</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddEventModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((event) => (
                  <div 
                    key={event.id} 
                    className="p-3 rounded-lg border flex items-start gap-3"
                  >
                    <div className={`${getEventTypeColor(event.type)} p-2 rounded-md`}>
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(event)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <Badge 
                          className={`${getEventTypeColor(event.type)} ${getEventTypeTextColor(event.type)}`}
                        >
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(event.date), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}