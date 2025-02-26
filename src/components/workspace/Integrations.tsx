"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { DropletIcon as Dropbox, Calendar, Slack, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  isActive: boolean
}

const initialIntegrations: Integration[] = [
  {
    id: "1",
    name: "Dropbox",
    description: "Connect your Dropbox account to easily share and access files.",
    icon: Dropbox,
    isActive: true,
  },
  {
    id: "2",
    name: "Google Calendar",
    description: "Sync your events and deadlines with Google Calendar.",
    icon: Calendar,
    isActive: false,
  },
  {
    id: "3",
    name: "Slack",
    description: "Get notifications and updates directly in your Slack workspace.",
    icon: Slack,
    isActive: true,
  },
]

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations)
  const [newIntegrationName, setNewIntegrationName] = useState("")
  const [newIntegrationDescription, setNewIntegrationDescription] = useState("")

  const toggleIntegration = (id: string) => {
    setIntegrations((prevIntegrations) =>
      prevIntegrations.map((integration) =>
        integration.id === id ? { ...integration, isActive: !integration.isActive } : integration,
      ),
    )
  }

  const handleAddIntegration = () => {
    const newIntegration: Integration = {
      id: String(integrations.length + 1),
      name: newIntegrationName,
      description: newIntegrationDescription,
      icon: Plus, // You might want to use a default icon or allow users to select one
      isActive: false,
    }
    setIntegrations([...integrations, newIntegration])
    setNewIntegrationName("")
    setNewIntegrationDescription("")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Integrations</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Integration</DialogTitle>
              <DialogDescription>Add a new integration to your workspace.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newIntegrationName}
                  onChange={(e) => setNewIntegrationName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newIntegrationDescription}
                  onChange={(e) => setNewIntegrationDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleAddIntegration}
                disabled={!newIntegrationName || !newIntegrationDescription}
              >
                Add Integration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
              <integration.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>{integration.description}</CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <Switch
                  id={`integration-${integration.id}`}
                  checked={integration.isActive}
                  onCheckedChange={() => toggleIntegration(integration.id)}
                />
                <label
                  htmlFor={`integration-${integration.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {integration.isActive ? "Active" : "Inactive"}
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

