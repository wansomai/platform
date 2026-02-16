'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PracticeArea, PRACTICE_AREA_LABELS } from '@/types/associates';
import { CircleChevronLeft, Zap, Mail, Clock, CheckCircle, Globe } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';
import { Card, CardContent } from '@/components/ui/card';
import { premadeAssociates } from '@/lib/constants/premadeAssociates';
import LogoAnimation from '@/components/commons/LogoAnimation';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';

const JURISDICTION_OPTIONS: { code: string; name: string; flag: string }[] = [
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺' },
];

interface DigestSubscription {
  id: string;
  frequency: string;
  topics: string[];
  jurisdictions: string[];
  isActive: boolean;
  lastSentAt: string | null;
  history: {
    id: string;
    subject: string;
    contentSummary: string;
    sourceCount: number;
    sentAt: string;
  }[];
}

function DigestSubscriptionForm({
  template,
}: {
  template: (typeof premadeAssociates)[number];
}) {
  const router = useRouter();
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    PracticeArea.GENERAL_PRACTICE,
  ]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(['KE']);
  const [subscription, setSubscription] = useState<DigestSubscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing subscription
  useEffect(() => {
    async function loadSubscription() {
      try {
        const data = await apiService.get<{ data: DigestSubscription | null }>('/api/digest/subscription');
        if (data.data) {
          const sub = data.data;
          setSubscription(sub);
          setFrequency(sub.frequency as 'daily' | 'weekly');
          setSelectedTopics(sub.topics);
          if (sub.jurisdictions?.length > 0) {
            setSelectedJurisdictions(sub.jurisdictions);
          }
        }
      } catch {
        // No subscription yet
      } finally {
        setIsLoading(false);
      }
    }
    loadSubscription();
  }, []);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const toggleJurisdiction = (code: string) => {
    setSelectedJurisdictions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubscribe = async () => {
    if (selectedTopics.length === 0) {
      toast.error('Please select at least one practice area');
      return;
    }
    if (selectedJurisdictions.length === 0) {
      toast.error('Please select at least one jurisdiction');
      return;
    }
    setIsSaving(true);
    try {
      const data = await apiService.post<{ data: DigestSubscription }>('/api/digest/subscription', {
        frequency,
        topics: selectedTopics,
        jurisdictions: selectedJurisdictions,
      });
      setSubscription({ ...data.data, history: subscription?.history || [] });
      toast.success(
        subscription?.isActive
          ? 'Subscription updated!'
          : 'Subscribed to Law 360!'
      );
    } catch {
      // apiService handles error toasts automatically
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsSaving(true);
    try {
      await apiService.delete('/api/digest/subscription');
      setSubscription((prev) =>
        prev ? { ...prev, isActive: false } : null
      );
      toast.success('Unsubscribed from Law 360');
    } catch {
      // apiService handles error toasts automatically
    } finally {
      setIsSaving(false);
    }
  };

  const Icon = template.icon;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LogoAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white">
      <div className="container mx-auto px-6 py- max-w-6xl p-6 space-y-6">
        <div className="flex items-start gap-6">
          <CircleChevronLeft
            className="h-10 w-10 mt-5 text-secondary hover:text-[#2a4d54] cursor-pointer"
            onClick={() => router.push('/workflows')}
          />
          <div className="grow space-y-6">
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
                      <div>
                        <h1 className="text-xl font-semibold">
                          {template.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    {subscription?.isActive && (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Jurisdictions */}
                  <div>
                    <Label className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Jurisdictions
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Select the countries whose case law, regulations, and legal news you want to track
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border rounded-lg max-h-64 overflow-y-auto">
                      {JURISDICTION_OPTIONS.map((j) => (
                        <div key={j.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={`jurisdiction-${j.code}`}
                            checked={selectedJurisdictions.includes(j.code)}
                            onCheckedChange={() => toggleJurisdiction(j.code)}
                          />
                          <label
                            htmlFor={`jurisdiction-${j.code}`}
                            className="text-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{j.flag}</span>
                            {j.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedJurisdictions.length} jurisdiction{selectedJurisdictions.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>

                  {/* Frequency */}
                  <div>
                    <Label className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Delivery Frequency
                    </Label>
                    <div className="flex gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setFrequency('daily')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors text-left ${
                          frequency === 'daily'
                            ? 'border-[#0a4b5e] bg-[#0a4b5e]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium">Daily</p>
                        <p className="text-sm text-muted-foreground">
                          Every morning at 8:00 AM UTC
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrequency('weekly')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors text-left ${
                          frequency === 'weekly'
                            ? 'border-[#0a4b5e] bg-[#0a4b5e]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium">Weekly</p>
                        <p className="text-sm text-muted-foreground">
                          Every Monday morning at 8:00 AM UTC
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Practice Area Topics */}
                  <div>
                    <Label className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Practice Areas
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Filter news by practice area
                    </p>
                    <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg max-h-52 overflow-y-auto">
                      {Object.entries(PRACTICE_AREA_LABELS).map(
                        ([area, label]) => (
                          <div
                            key={area}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`digest-${area}`}
                              checked={selectedTopics.includes(area)}
                              onCheckedChange={() => toggleTopic(area)}
                            />
                            <label
                              htmlFor={`digest-${area}`}
                              className="text-sm cursor-pointer"
                            >
                              {label}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedTopics.length} topic
                      {selectedTopics.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <div>
                      {subscription?.isActive && (
                        <Button
                          variant="ghost"
                          onClick={handleUnsubscribe}
                          disabled={isSaving}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Unsubscribe
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/workflows')}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleSubscribe}
                        disabled={isSaving || selectedTopics.length === 0 || selectedJurisdictions.length === 0}
                        className="min-w-[180px]"
                      >
                        {isSaving ? (
                          <LogoAnimation />
                        ) : subscription?.isActive ? (
                          'Update Subscription'
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Digest History */}
            {subscription?.history && subscription.history.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-base font-semibold mb-4">
                    Recent Digests
                  </h2>
                  <div className="space-y-3">
                    {subscription.history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {item.subject}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.contentSummary}
                          </p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.sentAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.sourceCount} sources
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

  // Render digest subscription form for digest templates
  if ('isDigest' in template && template.isDigest) {
    return <DigestSubscriptionForm template={template} />;
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
