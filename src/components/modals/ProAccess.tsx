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
import { ChartNoAxesCombined, Crown, Zap, Loader2 } from "lucide-react";
import { apiService } from "@/lib/api";

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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  // Clear payment error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentError(null);
    }
  }, [isOpen]);

  // Handle Personal Plan Upgrade - Paystack Payment
  const handlePersonalUpgrade = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const response = await apiService.post<{
        data: {
          authorizationUrl: string;
          accessCode: string;
          reference: string;
        };
      }>('/api/payments/initialize', {});

      if (response.data?.authorizationUrl) {
        // Redirect to Paystack payment page
        window.location.href = response.data.authorizationUrl;
      } else {
        setPaymentError('Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to initialize payment';
      setPaymentError(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Team Plan Request - Existing flow
  const handleTeamRequest = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestAccess({ ...formData, accountType: 'enterprise' });
  };

  const isAnyLoading = isLoading || isProcessingPayment;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Keep Using Wansom?</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Error Message */}
        {(errorMessage || paymentError) && (
          <p className={`text-xs font-light ${paymentError ? 'text-red-500' : 'text-gray-500'}`}>
            {paymentError || errorMessage}
          </p>
        )}

        <div className="flex flex-col md:flex-row">
          {/* Personal Plan - Paystack Payment */}
          <div className="border border-1 border-gray-300 rounded-tl-lg lg:rounded-bl-lg p-4  basis-1/2">
            <div>
              <h2 className="text-md font-semibold"> Personal Plan</h2>
              <p className="text-xs text-gray-600 mb-8">
                Best for solo practitioners who want to explore Wansom
              </p>
              <ul className="text-xs text-gray-600 mb-4 space-y-1">
                <li className="flex items-start gap-1"> <Zap className="h-3 w-3 text-green-500" /> Unlimited client/matter workspaces </li>
                <li className="flex items-center gap-1"> <Zap className="h-3 w-3 text-green-500" /> Unlimited messages </li>
                <li className="flex items-center gap-1"> <Zap className="h-3 w-3 text-green-500" /> Upto 5GB Vault Storage </li>
                <li className="flex items-center gap-1"> <Zap className="h-3 w-3 text-green-500" /> Upto 10 AI Associates </li>
                <li className="flex items-start gap-1"> <Zap className="h-3 w-3 text-green-500" /> Draft,Research,Calendar integrations </li>
              </ul>
              <div className="bg-gray-300 my-2 h-0.5 w-full"></div>
              <h1 className="text-2xl font-bold font-serif mb-2">$ 12/month</h1>
              <Button
                type="button"
                onClick={handlePersonalUpgrade}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                disabled={isAnyLoading}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Upgrade Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Team Plan - Request Flow */}
          <div className="border border-1 border-gray-300 p-4 lg:rounded-tr-lg rounded-br-lg  basis-1/2">
            <div>
              <h2 className="text-md font-semibold">Team Plan</h2>
              <p className="text-xs text-gray-600 mb-8">
                Collaborate more on client/matter workspaces with AI
              </p>
               <ul className="text-xs text-gray-600 mb-4 space-y-1">
                <li className="flex items-start gap-1"> <Zap className="h-3 w-3 text-green-500" /> Everything in Personal Plan </li>
                <li className="flex items-center gap-1"> <Zap className="h-3 w-3 text-green-500" /> Unlimited AI Associates </li>
                <li className="flex items-center gap-1"> <Zap className="h-3 w-3 text-green-500" /> Upto 50 GB Vault Storage </li>
                <li className="flex items-center gap-1"> <Zap className="h-3 w-3 text-green-500" /> Unlimited AI Associates </li>
                <li className="flex items-start gap-1"> <Zap className="h-3 w-3 text-green-500" /> Custom Workflows,Integrations </li>
                <li className="flex items-start gap-1"> <Zap className="h-3 w-3 text-green-500" /> Custom Deployments </li>
                <li className="flex items-start gap-1"> <Zap className="h-3 w-3 text-green-500" /> Team Training & Support </li>
              </ul>
              <Button
                variant="outline"
                onClick={handleTeamRequest}
                className="w-full"
                disabled={isAnyLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Request Pro Access
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2"></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProAccessModal;
