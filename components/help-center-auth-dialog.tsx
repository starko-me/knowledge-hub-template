"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  registerUser,
  resendVerificationEmail,
  verifyEmail,
} from "@/lib/help-center";
import { CLIENT_KEY } from "@/lib/help-center-config";

interface HelpCenterAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  closable?: boolean;
}

export function HelpCenterAuthDialog({
  open,
  onOpenChange,
  onSuccess,
  closable = true,
}: HelpCenterAuthDialogProps) {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await registerUser(email, CLIENT_KEY, name || email);
      if (result.ok) {
        setStep("verify");
      } else {
        setError(result.message || "Failed to send verification code");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await verifyEmail(code, email, CLIENT_KEY);
      if (result.ok && result.data?.token) {
        localStorage.setItem("starko-token", result.data.token);
        onSuccess();
        onOpenChange(false);
        // Reset form
        setStep("email");
        setEmail("");
        setName("");
        setCode("");
      } else {
        setError(result.message || "Invalid verification code");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const [isResending, setIsResending] = useState(false);

  const handleResendCode = async () => {
    setError(null);
    setIsResending(true);

    try {
      const result = await resendVerificationEmail(email, CLIENT_KEY);
      if (result.ok) {
        setError(null);
      } else {
        setError(result.message || "Failed to resend code");
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setStep("email");
      setEmail("");
      setName("");
      setCode("");
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog onOpenChange={closable ? handleClose : undefined} open={open}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => {
          if (!closable) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (!closable) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {step === "email" ? "Sign in to continue" : "Verify your email"}
          </DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Enter your email address to receive a verification code."
              : `We've sent a verification code to ${email}. Please enter it below.`}
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm" htmlFor="name">
                Name (optional)
              </label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                type="text"
                value={name}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button disabled={isLoading} size={"lg"} type="submit">
              {isLoading ? "Sending..." : "Send verification code"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm" htmlFor="code">
                Verification code
              </label>
              <InputOTP
                containerClassName="w-full justify-center"
                maxLength={4}
                onChange={(newValue) => {
                  setCode(newValue);
                  setError(null);
                  if (newValue.length === 4) {
                    handleVerify(newValue);
                  } else {
                    setError(null);
                  }
                }}
                value={code}
              >
                <InputOTPGroup className="w-full justify-center">
                  <InputOTPSlot className="h-12 w-full text-center" index={0} />
                  <InputOTPSlot className="h-12 w-full text-center" index={1} />
                  <InputOTPSlot className="h-12 w-full text-center" index={2} />
                  <InputOTPSlot className="h-12 w-full text-center" index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex flex-col gap-2">
              <Button
                disabled={isLoading || isResending}
                onClick={() => handleVerify(code)}
                type="button"
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <Button
                disabled={isLoading}
                onClick={handleResendCode}
                type="button"
                variant="ghost"
              >
                {isResending ? "Resending..." : "Resend code"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
