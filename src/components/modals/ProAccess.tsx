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
          <p className={`text-sm font-medium ${paymentError ? 'text-red-500' : 'text-gray-500'}`}>
            {paymentError || errorMessage}
          </p>
        )}

        <div className="flex flex-col md:flex-row gap-2">
          {/* Personal Plan - Paystack Payment */}
          <div className="bg-gray-100 p-4 rounded-lg basis-1/2">
            <div>
              <h2 className="text-md font-semibold">Upgrade Personal Plan</h2>
              <p className="text-xs text-gray-600 mb-12 md:mb-28">
                Get more work done faster, All your favorite legal tools in a unified workspace
              </p>
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
                    Upgrade Now <Zap className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Team Plan - Request Flow */}
          <div className="bg-gray-100 p-4 rounded-lg basis-1/2">
            <div>
              <h2 className="text-md font-semibold">Upgrade For Team</h2>
              <p className="text-xs text-gray-600 mb-12 md:mb-28">
                Collaborate more, unlimited client/matter workspaces and
                messages
              </p>
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
                    Request Pro Access <ChartNoAxesCombined className="ml-2 h-4 w-4"/>
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
