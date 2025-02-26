"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

export function AddEventModal() {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [type, setType] = useState("")

  const handleAddEvent = () => {
    // Implement logic to add event
    console.log("Adding event:", { title, date, type })
    // Reset the form after adding
    setTitle("")
    setDate("")
    setType("")
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>Add a new event to the project schedule.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select onValueChange={setType}>
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
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddEvent} disabled={!title || !date || !type}>
            Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

