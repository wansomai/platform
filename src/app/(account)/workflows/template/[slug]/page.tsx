'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PracticeArea, PRACTICE_AREA_LABELS } from '@/types/associates';
import { CircleChevronLeft, Zap } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';
import { Card, CardContent } from '@/components/ui/card';
import { premadeAssociates } from '@/lib/constants/premadeAssociates';
import LogoAnimation from '@/components/commons/LogoAnimation';

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const template = premadeAssociates.find((t) => t.id === slug);

  const { createAssociate, isProcessing } = useAssociates({
    onSuccess: () => {
      router.push('/workflows');
    },
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleUseTemplate = async () => {
    if (!template || isCreating || isProcessing) return;

    try {
      setIsCreating(true);
      await createAssociate({
        name: template.name,
        description: template.description,
        instructions: template.instructions,
        practiceAreas: template.practiceAreas,
      });
    } catch (err: any) {
      console.error('Error creating associate from template:', err);
    } finally {
      setIsCreating(false);
    }
  };

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Template not found</p>
        <Button variant="outline" onClick={() => router.push('/workflows')}>
          Back to Associates
        </Button>
      </div>
    );
  }

  const Icon = template.icon;
  const isBusy = isCreating || isProcessing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      <div className="container mx-auto px-6 py- max-w-6xl p-6 space-y-6">
        <div className="flex items-start gap-6">
          <CircleChevronLeft
            className="h-10 w-10 mt-5 text-secondary hover:text-[#2a4d54] cursor-pointer"
            onClick={() => router.push('/workflows')}
          />
          <div className="grow">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Template badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2.5 ${template.color.replace('text', 'bg')}/10`}
                      >
                        <Icon className={`h-6 w-6 ${template.color}`} />
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">
                        Premade Template
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <Label className="text-base">Associate Name</Label>
                    <Input
                      value={template.name}
                      readOnly
                      className="mt-2 bg-gray-50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-base">Brief Description</Label>
                    <Input
                      value={template.description}
                      readOnly
                      className="mt-2 bg-gray-50"
                    />
                  </div>

                  {/* Practice Areas */}
                  <div>
                    <Label className="text-base">Practice Areas</Label>
                    <div className="grid grid-cols-2 gap-3 mt-3 p-4 border rounded-lg max-h-36 overflow-y-auto bg-gray-50">
                      {Object.entries(PRACTICE_AREA_LABELS).map(([area, label]) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={`template-${area}`}
                            checked={template.practiceAreas.includes(area as PracticeArea)}
                            disabled
                          />
                          <label htmlFor={`template-${area}`} className="text-sm">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {template.practiceAreas.length} practice area{template.practiceAreas.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>

                  {/* Instructions */}
                  <div>
                    <Label className="text-base">Instructions & Expertise</Label>
                    <Textarea
                      value={template.instructions}
                      readOnly
                      rows={8}
                      className="mt-2 h-48 bg-gray-50"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/workflows')}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleUseTemplate}
                      disabled={isBusy}
                      className="min-w-[180px]"
                    >
                      {isBusy ? (
                        <LogoAnimation />
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Use Template
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
