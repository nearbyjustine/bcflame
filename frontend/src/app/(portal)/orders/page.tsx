'use client'

import { useEffect, useState } from 'react'
import { Loader2, Clock, Package } from 'lucide-react'
import { getMyOrderInquiries } from '@/lib/api/customization'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { OrderInquiry } from '@/types/customization'

// Status badge variant mapping
const getStatusVariant = (
  status: string
): 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'default' => {
  switch (status) {
    case 'pending':
      return 'pending'
    case 'in_review':
      return 'in_review'
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'completed':
      return 'completed'
    default:
      return 'default'
  }
}

// Format date helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function OrdersPage() {
  const [inquiries, setInquiries] = useState<OrderInquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInquiry, setSelectedInquiry] = useState<OrderInquiry | null>(null)

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getMyOrderInquiries()
      setInquiries(data)
    } catch (err: any) {
      console.error('Error fetching order inquiries:', err)
      setError('Failed to load order inquiries. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (inquiry: OrderInquiry) => {
    setSelectedInquiry(inquiry)
  }

  const handleCloseDetails = () => {
    setSelectedInquiry(null)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">View and track your custom product order inquiries</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchInquiries} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                Customize a product to create your first order inquiry
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inquiries.map((inquiry) => {
            const product = inquiry.attributes.product?.data
            const productName = product?.attributes?.name || 'Unknown Product'
            const productImage = product?.attributes?.images?.data?.[0]
            const imageUrl =
              productImage?.attributes?.url && process.env.NEXT_PUBLIC_STRAPI_URL
                ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${productImage.attributes.url}`
                : null

            return (
              <Card
                key={inquiry.id}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold mb-1">
                        {inquiry.attributes.inquiry_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{productName}</p>
                    </div>
                    <Badge variant={getStatusVariant(inquiry.attributes.status)}>
                      {inquiry.attributes.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {imageUrl && (
                    <div className="aspect-video relative bg-muted rounded-lg overflow-hidden mb-4">
                      <img
                        src={imageUrl}
                        alt={productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Submitted {formatDate(inquiry.attributes.createdAt)}</span>
                    </div>

                    {inquiry.attributes.selections && (
                      <div className="text-muted-foreground">
                        <p className="text-xs">
                          {inquiry.attributes.selections.photos?.length || 0} photos •{' '}
                          {inquiry.attributes.selections.budStyles?.length || 0} bud styles •{' '}
                          {inquiry.attributes.selections.backgrounds?.length || 0} backgrounds
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleViewDetails(inquiry)}
                    variant="outline"
                    className="w-full"
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Modal (Simple version - can be enhanced later) */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-card border border-border rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {selectedInquiry.attributes.inquiry_number}
                </h2>
                <Badge variant={getStatusVariant(selectedInquiry.attributes.status)}>
                  {selectedInquiry.attributes.status.replace('_', ' ')}
                </Badge>
              </div>
              <button
                onClick={handleCloseDetails}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Product Info */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Product</h3>
                <p className="text-muted-foreground">
                  {selectedInquiry.attributes.product?.data?.attributes?.name || 'Unknown Product'}
                </p>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Contact Information</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{selectedInquiry.attributes.customer_name}</p>
                  <p>{selectedInquiry.attributes.customer_email}</p>
                  {selectedInquiry.attributes.customer_phone && (
                    <p>{selectedInquiry.attributes.customer_phone}</p>
                  )}
                </div>
              </div>

              {/* Selections */}
              {selectedInquiry.attributes.selections && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Customization Details</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Photos: {selectedInquiry.attributes.selections.photos?.length || 0}</p>
                    <p>
                      Bud Styles: {selectedInquiry.attributes.selections.budStyles?.length || 0}
                    </p>
                    <p>
                      Backgrounds: {selectedInquiry.attributes.selections.backgrounds?.length || 0}
                    </p>
                    <p>Fonts: {selectedInquiry.attributes.selections.fonts?.length || 0}</p>
                    {selectedInquiry.attributes.selections.preBagging &&
                      selectedInquiry.attributes.selections.preBagging.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold text-foreground mb-1">Pre-Bagging Options:</p>
                          {selectedInquiry.attributes.selections.preBagging.map((pb, index) => (
                            <p key={index} className="ml-2">
                              • Option #{pb.optionId}: Qty {pb.quantity}
                              {pb.customText && ` - ${pb.customText}`}
                            </p>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedInquiry.attributes.additional_notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Additional Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedInquiry.attributes.additional_notes}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                <p>Submitted: {formatDate(selectedInquiry.attributes.createdAt)}</p>
                {selectedInquiry.attributes.updatedAt !==
                  selectedInquiry.attributes.createdAt && (
                  <p>Updated: {formatDate(selectedInquiry.attributes.updatedAt)}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleCloseDetails}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
