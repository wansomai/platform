// src/components/actions/DocumentGenerationForm.tsx
"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileText, Upload } from "lucide-react"

export interface DocumentGenerationFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function DocumentGenerationForm({ onSubmit, onCancel }: DocumentGenerationFormProps) {
  const [formData, setFormData] = useState({
    documentType: 'contract',
    title: '',
    includeConversation: true,
    templateId: 'standard',
    format: 'docx'
  })
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleSubmit = () => {
    onSubmit({
      type: 'generate-document',
      parameters: formData
    })
  }
  
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type</Label>
        <Select 
          value={formData.documentType}
          onValueChange={(value) => handleChange('documentType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="memo">Legal Memo</SelectItem>
            <SelectItem value="letter">Legal Letter</SelectItem>
            <SelectItem value="brief">Legal Brief</SelectItem>
            <SelectItem value="summary">Case Summary</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="title">Document Title</Label>
        <Input 
          id="title" 
          placeholder="Enter document title" 
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="templateId">Template</Label>
        <Select 
          value={formData.templateId}
          onValueChange={(value) => handleChange('templateId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard Template</SelectItem>
            <SelectItem value="professional">Professional Template</SelectItem>
            <SelectItem value="formal">Formal Legal Template</SelectItem>
            <SelectItem value="simple">Simple Template</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="includeConversation" 
          checked={formData.includeConversation}
          onCheckedChange={(checked) => handleChange('includeConversation', !!checked)}
        />
        <Label htmlFor="includeConversation">Include current conversation context</Label>
      </div>
      
      <div className="space-y-2">
        <Label>Format</Label>
        <RadioGroup 
          value={formData.format}
          onValueChange={(value) => handleChange('format', value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="docx" id="docx" />
            <Label htmlFor="docx">DOCX</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="pdf" />
            <Label htmlFor="pdf">PDF</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="md" id="md" />
            <Label htmlFor="md">Markdown</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>
          <FileText className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
      </div>
    </div>
  )
}