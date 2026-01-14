'use client'

import { useEffect, useState } from 'react'
import { Loader2, Clock, Package } from 'lucide-react'
import { getMyOrderInquiries } from '@/lib/api/customization'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { OrderInquiry } from '@/types/customization'
import { getImageUrl } from '@/lib/utils/image'

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

// Format status label with proper capitalization
const formatStatusLabel = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
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
            const imageUrl = getImageUrl(productImage)

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
                      {formatStatusLabel(inquiry.attributes.status)}
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

      {/* Enhanced Detail Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-card border border-border rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {selectedInquiry.attributes.inquiry_number}
                </h2>
                <Badge variant={getStatusVariant(selectedInquiry.attributes.status)}>
                  {formatStatusLabel(selectedInquiry.attributes.status)}
                </Badge>
              </div>
              <button
                onClick={handleCloseDetails}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
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
              {/* Product Info with Image */}
              <div className="flex gap-4 p-4 bg-muted/30 rounded-xl border">
                {(() => {
                  const productImage = selectedInquiry.attributes.product?.data?.attributes?.images?.data?.[0];
                  const imageUrl = getImageUrl(productImage);
                  return imageUrl ? (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={selectedInquiry.attributes.product?.data?.attributes?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null;
                })()}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {selectedInquiry.attributes.product?.data?.attributes?.name || 'Unknown Product'}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    Category: {selectedInquiry.attributes.product?.data?.attributes?.category || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {selectedInquiry.attributes.product?.data?.attributes?.sku || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-4 border rounded-xl">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">
                      {selectedInquiry.attributes.customer?.data?.attributes?.username || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">
                      {selectedInquiry.attributes.customer?.data?.attributes?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customization Selections */}
              {selectedInquiry.attributes.selections && (
                <div className="p-4 border rounded-xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Customization Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{selectedInquiry.attributes.selections.photos?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Photos</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{selectedInquiry.attributes.selections.budStyles?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Bud Styles</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{selectedInquiry.attributes.selections.backgrounds?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Backgrounds</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{selectedInquiry.attributes.selections.fonts?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Fonts</p>
                    </div>
                  </div>

                  {/* Pre-Bagging Details */}
                  {selectedInquiry.attributes.selections.preBagging &&
                    selectedInquiry.attributes.selections.preBagging.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-semibold mb-2">Pre-Bagging Options</p>
                        <div className="space-y-2">
                          {selectedInquiry.attributes.selections.preBagging.map((pb, index) => (
                            <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg">
                              <span>Option #{pb.optionId}</span>
                              <div className="text-right">
                                <span className="font-medium">Qty: {pb.quantity}</span>
                                <span className="text-muted-foreground mx-2">×</span>
                                <span className="text-muted-foreground">{pb.unitSize}{pb.unitSizeUnit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Additional Notes */}
              {(selectedInquiry.attributes.additional_notes || selectedInquiry.attributes.notes) && (
                <div className="p-4 border rounded-xl">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Additional Notes
                  </h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {selectedInquiry.attributes.additional_notes || selectedInquiry.attributes.notes}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Submitted: {formatDate(selectedInquiry.attributes.createdAt)}</span>
                </div>
                {selectedInquiry.attributes.updatedAt !== selectedInquiry.attributes.createdAt && (
                  <span>Updated: {formatDate(selectedInquiry.attributes.updatedAt)}</span>
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
