// src/components/actions/DocumentSummaryForm.tsx
"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { BookOpen, FileText, PlusCircle } from "lucide-react"
import { useParams } from "next/navigation"
import { useConversationDocumentsStore } from "@/store/conversation-documents.store"

export interface DocumentSummaryFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function DocumentSummaryForm({ onSubmit, onCancel }: DocumentSummaryFormProps) {
  const params = useParams()
  const { documents, fetchConversationDocuments } = useConversationDocumentsStore()
  
  const [formData, setFormData] = useState({
    title: 'Document Summary',
    documentIds: [] as string[],
    summarizationType: 'comprehensive', // brief, comprehensive, extraction
    focusAreas: [] as string[],
    includeKeypoints: true,
    format: 'text',
    length: 2, // 1-3 scale (short, medium, long)
    customFocusArea: '',
  })
  
  // Fetch conversation documents when component mounts
  useEffect(() => {
    if (params.id) {
      fetchConversationDocuments(params.id as string)
    }
  }, [fetchConversationDocuments, params.id])
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const toggleDocumentSelection = (docId: string) => {
    setFormData(prev => {
      const currentDocs = [...prev.documentIds]
      if (currentDocs.includes(docId)) {
        return {
          ...prev,
          documentIds: currentDocs.filter(id => id !== docId)
        }
      } else {
        return {
          ...prev,
          documentIds: [...currentDocs, docId]
        }
      }
    })
  }
  
  const handleToggleFocusArea = (area: string) => {
    setFormData(prev => {
      const currentAreas = [...prev.focusAreas]
      if (currentAreas.includes(area)) {
        return {
          ...prev,
          focusAreas: currentAreas.filter(a => a !== area)
        }
      } else {
        return {
          ...prev,
          focusAreas: [...currentAreas, area]
        }
      }
    })
  }
  
  const addCustomFocusArea = () => {
    if (formData.customFocusArea.trim() && !formData.focusAreas.includes(formData.customFocusArea)) {
      setFormData(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, prev.customFocusArea],
        customFocusArea: ''
      }))
    }
  }
  
  const handleSubmit = () => {
    onSubmit({
      type: 'summarize-document',
      parameters: formData
    })
  }
  
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Summary Title</Label>
        <Input 
          id="title" 
          placeholder="Document Summary" 
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Documents to Summarize</Label>
        {documents.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`doc-${doc.id}`} 
                  checked={formData.documentIds.includes(doc.id)}
                  onCheckedChange={() => toggleDocumentSelection(doc.id)}
                />
                <Label htmlFor={`doc-${doc.id}`} className="text-sm cursor-pointer">
                  {doc.title} ({doc.fileType.toUpperCase()})
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
            No documents available. Add documents to the conversation first.
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Summary Type</Label>
        <RadioGroup 
          value={formData.summarizationType}
          onValueChange={(value) => handleChange('summarizationType', value)}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="brief" id="brief" />
            <Label htmlFor="brief">Brief Overview</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="comprehensive" id="comprehensive" />
            <Label htmlFor="comprehensive">Comprehensive Summary</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="extraction" id="extraction" />
            <Label htmlFor="extraction">Key Information Extraction</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="length">Summary Length</Label>
          <span className="text-sm text-muted-foreground">
            {formData.length === 1 ? 'Short' : formData.length === 2 ? 'Medium' : 'Long'}
          </span>
        </div>
        <Slider 
          id="length"
          min={1} 
          max={3} 
          step={1} 
          value={[formData.length]}
          onValueChange={(value) => handleChange('length', value[0])}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Focus Areas (Optional)</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {['Legal analysis', 'Facts', 'Arguments', 'Precedents', 'Key dates', 'Parties involved'].map(area => (
            <Button 
              key={area}
              variant={formData.focusAreas.includes(area) ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggleFocusArea(area)}
              type="button"
            >
              {area}
            </Button>
          ))}
          {formData.focusAreas.filter(area => 
            !['Legal analysis', 'Facts', 'Arguments', 'Precedents', 'Key dates', 'Parties involved'].includes(area)
          ).map(customArea => (
            <Button 
              key={customArea}
              variant="default"
              size="sm"
              onClick={() => handleToggleFocusArea(customArea)}
              type="button"
            >
              {customArea}
            </Button>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input 
            placeholder="Add custom focus area" 
            value={formData.customFocusArea}
            onChange={(e) => handleChange('customFocusArea', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomFocusArea()}
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={addCustomFocusArea}
            type="button"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="includeKeypoints" 
          checked={formData.includeKeypoints}
          onCheckedChange={(checked) => handleChange('includeKeypoints', !!checked)}
        />
        <Label htmlFor="includeKeypoints">Include bullet-point key takeaways</Label>
      </div>
      
      <div className="space-y-2">
        <Label>Output Format</Label>
        <RadioGroup 
          value={formData.format}
          onValueChange={(value) => handleChange('format', value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="text" />
            <Label htmlFor="text">Text</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="docx" id="format-docx" />
            <Label htmlFor="format-docx">DOCX</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="format-pdf" />
            <Label htmlFor="format-pdf">PDF</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          disabled={formData.documentIds.length === 0}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Summarize Documents
        </Button>
      </div>
    </div>
  )
}