"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CreditCard,
  CheckCircle,
  Clock,
  Hash,
  Calendar,
  IndianRupee,
  User,
  X,
  ExternalLink
} from "lucide-react"

interface PaymentInfoModalProps {
  userId: string
  userName: string
  onClose: () => void
}

interface PaymentData {
  transactionId: string
  orderId: string
  amount: number
  memberType: 'root' | 'member'
  paidAt: string
  paidByName: string
  paidByLoginId: string
  familyCode: string
  currency: string
}

export function PaymentInfoModal({ userId, userName, onClose }: PaymentInfoModalProps) {
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/payment/status/${userId}`)
        const data = await res.json()

        if (data.success) {
          setPaymentStatus(data.data.paymentStatus)
          if (data.data.payment) {
            setPaymentData(data.data.payment)
          }
        }
      } catch (err) {
        console.error('[PAYMENT INFO MODAL] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPayment()
  }, [userId])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return 'N/A'
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Payment Information
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">For: <strong>{userName}</strong></p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-3 text-gray-500">Loading payment info...</span>
          </div>
        ) : paymentStatus === 'pending' ? (
          // Payment Pending State
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <Badge className="bg-orange-100 text-orange-800 text-sm px-3 py-1">
                <Clock className="w-3 h-3 mr-1 inline" />
                Payment Pending
              </Badge>
            </div>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              The root member of this family has not yet completed the ID verification payment for this member.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-left">
              <p className="text-xs text-orange-700 font-medium">ℹ️ Payment Required</p>
              <p className="text-xs text-orange-600 mt-1">
                Root member must pay ₹{paymentData ? '' : ''} via the "Activate" button on their dashboard before this account can be verified.
              </p>
            </div>
          </div>
        ) : (
          // Payment Done State
          <div className="space-y-4 py-2">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Payment Successful</p>
                  <p className="text-xs text-green-600">Awaiting admin verification</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                PAID
              </Badge>
            </div>

            {/* Payment Details */}
            {paymentData && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Transaction Details</h3>

                <div className="bg-gray-50 rounded-lg border divide-y">
                  {/* Transaction ID */}
                  <div className="flex items-start gap-3 p-3">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="text-sm font-mono font-medium text-gray-900 truncate">
                        {paymentData.transactionId || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Order ID */}
                  <div className="flex items-start gap-3 p-3">
                    <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Razorpay Order ID</p>
                      <p className="text-sm font-mono font-medium text-gray-900 truncate">
                        {paymentData.orderId}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-3 p-3">
                    <IndianRupee className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Amount Paid</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{paymentData.amount}{' '}
                        <span className="text-xs font-normal text-gray-500">
                          ({paymentData.memberType === 'root' ? 'Root Member Fee' : 'Family Member Fee'})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Paid At */}
                  <div className="flex items-center gap-3 p-3">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Payment Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(paymentData.paidAt)}
                      </p>
                    </div>
                  </div>

                  {/* Paid By */}
                  <div className="flex items-center gap-3 p-3">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Paid By (Root Member)</p>
                      <p className="text-sm font-medium text-gray-900">
                        {paymentData.paidByName}
                        <span className="text-xs text-gray-400 ml-1">({paymentData.paidByLoginId})</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                ✅ Payment has been verified. You can now proceed to <strong>Verify & Activate</strong> this citizen's account.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="w-4 h-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
