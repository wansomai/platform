// src/components/actions/ResearchQuestionForm.tsx
"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileQuestion, SearchIcon } from "lucide-react"

export interface ResearchQuestionFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function ResearchQuestionForm({ onSubmit, onCancel }: ResearchQuestionFormProps) {
  const [formData, setFormData] = useState({
    question: '',
    depth: 2, // 1-3 scale (brief, standard, comprehensive)
    includeExternalSources: true,
    includeRelevantCaseLaw: true,
    includeStatutes: true,
    useCaseDocuments: true,
    mode: 'standard' // quick, standard, comprehensive
  })
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleSubmit = () => {
    onSubmit({
      type: 'research-question',
      parameters: formData
    })
  }
  
  return (
    <div className="space-y-4 py-4">
      <Tabs defaultValue="standard" onValueChange={(value) => handleChange('mode', value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">Quick</TabsTrigger>
          <TabsTrigger value="standard">Standard</TabsTrigger>
          <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
        </TabsList>
        <TabsContent value="quick" className="pt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Get a concise answer with basic information quickly. Best for straightforward questions.
          </p>
        </TabsContent>
        <TabsContent value="standard" className="pt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Balanced research with relevant citations and moderate depth. Suitable for most questions.
          </p>
        </TabsContent>
        <TabsContent value="comprehensive" className="pt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Thorough analysis with comprehensive citations, case law and related considerations. Best for complex legal questions.
          </p>
        </TabsContent>
      </Tabs>
      
      <div className="space-y-2">
        <Label htmlFor="question">Research Question</Label>
        <Textarea 
          id="question" 
          placeholder="Enter your legal research question here..." 
          value={formData.question}
          onChange={(e) => handleChange('question', e.target.value)}
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="depth">Research Depth</Label>
          <span className="text-sm text-muted-foreground">
            {formData.depth === 1 ? 'Brief' : formData.depth === 2 ? 'Standard' : 'Comprehensive'}
          </span>
        </div>
        <Slider 
          id="depth"
          min={1} 
          max={3} 
          step={1} 
          value={[formData.depth]}
          onValueChange={(value) => handleChange('depth', value[0])}
        />
      </div>
      
      <div className="space-y-2 border rounded-md p-3">
        <Label className="text-sm font-medium">Research Sources</Label>
        <div className="space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeExternalSources" 
              checked={formData.includeExternalSources}
              onCheckedChange={(checked) => handleChange('includeExternalSources', !!checked)}
            />
            <Label htmlFor="includeExternalSources" className="text-sm">Include external legal sources</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeRelevantCaseLaw" 
              checked={formData.includeRelevantCaseLaw}
              onCheckedChange={(checked) => handleChange('includeRelevantCaseLaw', !!checked)}
            />
            <Label htmlFor="includeRelevantCaseLaw" className="text-sm">Include relevant case law</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeStatutes" 
              checked={formData.includeStatutes}
              onCheckedChange={(checked) => handleChange('includeStatutes', !!checked)}
            />
            <Label htmlFor="includeStatutes" className="text-sm">Include applicable statutes and regulations</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="useCaseDocuments" 
              checked={formData.useCaseDocuments}
              onCheckedChange={(checked) => handleChange('useCaseDocuments', !!checked)}
            />
            <Label htmlFor="useCaseDocuments" className="text-sm">Reference case documents</Label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>
          <SearchIcon className="mr-2 h-4 w-4" />
          Research Question
        </Button>
      </div>
    </div>
  )
}