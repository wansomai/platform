// components/ProAccessModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {  Crown } from "lucide-react";

interface ProAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestAccess: (formData: {
    name: string;
    email: string;
    accountType: string;
  }) => void;
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
  userData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    accountType: "",
  });

  // Pre-populate form when modal opens or user data changes
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        accountType: userData.accountType || "",
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
        <div className="flex flex-col gap-5">   
            <img
              src="/images/ai-in-house-counsel.jpg"
              alt="Pro Access Illustration"
              className="rounded-lg"
            />

          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">
                Create Unlimited Workspaces
              </h2>
              <p className="text-sm text-gray-600">
                Collaborate more with your team,unlimited client/matter workspaces and messages
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Automated Workflows
              </h2>
              <p className="text-sm text-gray-600">
                Build custom automated worflows for routine tasks and processes
              </p>
            </div>
             <div>
              <h2 className="text-lg font-semibold">
                10000+ Legal Templates
              </h2>
              <p className="text-sm text-gray-600">
             Boost legal drafting with access to 10,000+ customizable professional legal templates
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="sm:flex-1"
            disabled={isLoading}
          >
            Not Now
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="sm:flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            disabled={
              isLoading ||
              !formData.name ||
              !formData.email ||
              !formData.accountType
            }
          >
            {isLoading ? "Processing..." : "Request Pro Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProAccessModal;
