'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Send, HeadphonesIcon } from 'lucide-react';
import { apiService } from '@/lib/api';

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: 'general',         label: 'General Inquiry' },
  { value: 'technical',       label: 'Technical Issue' },
  { value: 'billing',         label: 'Billing & Subscription' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'account',         label: 'Account & Access' },
  { value: 'other',           label: 'Other' },
] as const;

export default function SupportModal({ open, onOpenChange }: SupportModalProps) {
  const { data: session } = useSession();
  const user = (session as any)?.user;

  const [name,     setName]     = useState(user?.name  || user?.fullName || '');
  const [email,    setEmail]    = useState(user?.email || '');
  const [category, setCategory] = useState('');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');

  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())     e.name     = 'Your name is required.';
    if (!email.trim())    e.email    = 'Your email is required.';
    if (!category)        e.category = 'Please select a category.';
    if (!subject.trim())  e.subject  = 'A subject is required.';
    if (message.trim().length < 20) e.message = 'Please describe your issue in at least 20 characters.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setErrors({});
    setIsSubmitting(true);
    try {
      await apiService.post('/api/support', { name, email, category, subject, message });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state on close (after a beat to avoid flicker)
      setTimeout(() => {
        setName(user?.name || user?.fullName || '');
        setEmail(user?.email || '');
        setCategory('');
        setSubject('');
        setMessage('');
        setErrors({});
        setSubmitted(false);
      }, 200);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-8 px-2 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Message sent!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Our team will get back to you at <strong>{email}</strong> within one business day.
              </p>
            </div>
            <Button
              onClick={() => handleOpenChange(false)}
              className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <HeadphonesIcon className="h-5 w-5 text-[#0a4b5e]" />
                <DialogTitle>Help &amp; Support</DialogTitle>
              </div>
              <DialogDescription>
                Send us a message and we'll get back to you within one business day.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Name + Email row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="support-name" className={errors.name ? 'text-red-600' : ''}>
                    Name
                  </Label>
                  <Input
                    id="support-name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: '' })); }}
                    placeholder="Your full name"
                    className={errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="support-email" className={errors.email ? 'text-red-600' : ''}>
                    Email
                  </Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: '' })); }}
                    placeholder="you@example.com"
                    className={errors.email ? 'border-red-400 ring-1 ring-red-400' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className={errors.category ? 'text-red-600' : ''}>Category</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setErrors((x) => ({ ...x, category: '' })); }} disabled={isSubmitting}>
                  <SelectTrigger className={errors.category ? 'border-red-400 ring-1 ring-red-400' : ''}>
                    <SelectValue placeholder="What's this about?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="support-subject" className={errors.subject ? 'text-red-600' : ''}>
                  Subject
                </Label>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setErrors((x) => ({ ...x, subject: '' })); }}
                  placeholder="Brief summary of your issue"
                  className={errors.subject ? 'border-red-400 ring-1 ring-red-400' : ''}
                  disabled={isSubmitting}
                />
                {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="support-message" className={errors.message ? 'text-red-600' : ''}>
                  Message
                </Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setErrors((x) => ({ ...x, message: '' })); }}
                  placeholder="Describe your question or issue in detail…"
                  rows={5}
                  className={errors.message ? 'border-red-400 ring-1 ring-red-400 resize-none' : 'resize-none'}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-start">
                  {errors.message
                    ? <p className="text-xs text-red-500">{errors.message}</p>
                    : <span />
                  }
                  <p className="text-xs text-muted-foreground ml-auto">{message.length} chars</p>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                  : <><Send className="h-4 w-4 mr-2" />Send Message</>
                }
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
