// components/ProAccessModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Crown } from "lucide-react";

interface ProAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestAccess: () => void;
  isLoading?: boolean;
}

const ProAccessModal: React.FC<ProAccessModalProps> = ({
  isOpen,
  onClose,
  onRequestAccess,
  isLoading = false
}) => {
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
        
        <div className="space-y-4 py-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <h3 className="font-medium text-amber-800 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Associates are now in Pro
            </h3>
            <p className="text-sm text-amber-700">
            Associates can handle the most complex tasks with little supervision learning and correcting themselves to achieve the best outcome.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">With Pro access, you'll get:</h3>
            <ul className="space-y-2">
             
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Create unlimited  AI associates in your workspaces</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Unlimited vault storage and document processing</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Create unlimited project workspaces</span>
              </li>
               <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Connect more data sources and tools;Google Drive, Calendar,Private datastore</span>
              </li>
            </ul>
          </div>
          
          {/* <div className="mt-2 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Pro Plan</h3>
                <p className="text-sm text-gray-500">All features unlocked</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">$39.00 <span className="text-sm font-normal text-gray-500">/month</span></p>
                <p className="text-xs text-gray-500">Billed monthly</p>
              </div>
            </div>
          </div> */}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="sm:flex-1">
            Not Now
          </Button>
          <Button 
            onClick={onRequestAccess}
            className="sm:flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Request Pro Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProAccessModal;