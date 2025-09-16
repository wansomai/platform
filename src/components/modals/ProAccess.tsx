// components/ProAccessModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Crown } from "lucide-react";

interface ProAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestAccess: (formData: { name: string; email: string; accountType: string }) => void;
  isLoading?: boolean;
  errorMessage?: string;
  userData?: {
    name?: string;
    email?: string;
    accountType?: string;
  };
}

const ProAccessModal: React.FC<ProAccessModalProps> = ({
  isOpen,
  onClose,
  onRequestAccess,
  isLoading = false,
  errorMessage = "You have reached your plan limits. Request Pro access to continue.",
  userData
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    accountType: ''
  });

  // Pre-populate form when modal opens or user data changes
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        accountType: userData.accountType || ''
      });
    }
  }, [userData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestAccess(formData);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Upgrade to wansom Pro</DialogTitle>
             
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <h3 className="font-medium text-amber-800 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Plan Limit Reached
            </h3>
            <p className="text-sm text-amber-700">
              {errorMessage}
            </p>
          </div>

          <div className="space-y-4">
            {/* Name and Email in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            {/* Account Type Select */}
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="sm:flex-1" disabled={isLoading}>
            Not Now
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="sm:flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            disabled={isLoading || !formData.name || !formData.email || !formData.accountType}
          >
            {isLoading ? "Processing..." : "Request Pro Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProAccessModal;