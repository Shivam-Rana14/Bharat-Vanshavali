"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, User, IndianRupee, AlertCircle, CheckCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  member: {
    userId: string
    name: string
    loginId: string
    isRoot: boolean
  }
  onPaymentSuccess: (userId: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentModal({ open, onClose, member, onPaymentSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const { toast } = useToast()

  const amount = member.isRoot ? 100 : 10

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.Razorpay) {
      setIsScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setIsScriptLoaded(true)
    script.onerror = () => {
      toast({
        title: "Script Load Error",
        description: "Failed to load payment gateway. Please check your internet connection.",
        variant: "destructive"
      })
    }
    document.body.appendChild(script)

    return () => {
      // Don't remove it; might be needed again
    }
  }, [])

  const handlePayment = async () => {
    if (!isScriptLoaded) {
      toast({
        title: "Payment Not Ready",
        description: "Payment gateway is still loading. Please wait.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Step 1: Create the order on our server
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.userId })
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok || !orderData.success) {
        toast({
          title: "Order Failed",
          description: orderData.error || "Failed to create payment order",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      const { orderId, amount: amountInPaise, currency, keyId, memberName } = orderData.data

      // Step 2: Open Razorpay checkout
      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency,
        name: 'Bharat Vanshavali',
        description: `ID Verification Fee for ${memberName}`,
        image: '/logo.png',
        order_id: orderId,
        handler: async function (response: any) {
          // Step 3: Verify payment on our server
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                userId: member.userId
              })
            })

            const verifyData = await verifyRes.json()

            if (verifyData.success) {
              toast({
                title: "Payment Successful! 🎉",
                description: `Payment for ${member.name} has been completed. Your account is now under review.`,
              })
              onPaymentSuccess(member.userId)
              onClose()
            } else {
              toast({
                title: "Verification Failed",
                description: verifyData.error || "Payment verification failed. Please contact support.",
                variant: "destructive"
              })
            }
          } catch (err) {
            toast({
              title: "Verification Error",
              description: "An error occurred during payment verification. Please contact support.",
              variant: "destructive"
            })
          }
          setIsLoading(false)
        },
        prefill: {
          name: member.name,
        },
        notes: {
          memberLoginId: member.loginId,
          memberType: member.isRoot ? 'Root Member' : 'Family Member'
        },
        theme: {
          color: '#f97316' // Orange matching the site theme
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false)
          }
        }
      }

      const razorpayInstance = new window.Razorpay(options)
      razorpayInstance.on('payment.failed', function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment was not successful. Please try again.",
          variant: "destructive"
        })
        setIsLoading(false)
      })
      razorpayInstance.open()
    } catch (error) {
      console.error('[PAYMENT MODAL] Error:', error)
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="w-5 h-5 text-orange-500" />
            ID Verification Payment
          </DialogTitle>
          <DialogDescription>
            Complete payment to submit this member's ID for admin verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Member Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">ID: {member.loginId}</p>
                <Badge className={member.isRoot ? "bg-purple-100 text-purple-800 mt-1" : "bg-blue-100 text-blue-800 mt-1"}>
                  {member.isRoot ? "Root Member" : "Family Member"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Amount to Pay</p>
            <div className="flex items-center gap-1">
              <IndianRupee className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{amount}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {member.isRoot
                ? "₹100 — Root Member ID Verification"
                : "₹10 — Family Member ID Verification"}
            </p>
          </div>

          {/* Info Box */}
          <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              After payment, this member's ID will be submitted for admin review. Once the admin verifies, 
              the status will change to <strong>Verified</strong>.
            </p>
          </div>

          {/* Supported Payment Methods */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Accepts UPI, Cards, Net Banking & more</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net Banking'].map(method => (
                <span key={method} className="text-xs bg-gray-100 px-2 py-1 rounded border">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 touch-target"
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white touch-target"
            disabled={isLoading || !isScriptLoaded}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Pay ₹{amount}
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
