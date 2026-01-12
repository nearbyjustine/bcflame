'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Upload, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { userProfile, uploadLogo } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset status
    setUploadStatus('idle');
    setErrorMessage(null);

    // Validate file type
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      setErrorMessage('Only PNG, JPG, and SVG files are allowed');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setUploadStatus('error');
      setErrorMessage('File size must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      await uploadLogo(file);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error: any) {
      setUploadStatus('error');
      setErrorMessage(error.response?.data?.error?.message || 'Logo upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const logoUrl = userProfile?.reseller_logo?.url
    ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${userProfile.reseller_logo.url}`
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-neutral-400">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-400">Username</label>
              <p className="text-lg font-semibold text-white">{userProfile?.username || 'Not available'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-400">Email</label>
              <p className="text-lg font-semibold text-white">{userProfile?.email || 'Not available'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Reseller Logo Upload */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>Reseller Logo</CardTitle>
            <CardDescription>
              Upload your business logo to be included on custom product packaging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Logo Preview */}
            {logoUrl && (
              <div>
                <p className="text-sm font-medium text-neutral-400 mb-3">Current Logo</p>
                <div className="border border-neutral-800 rounded-xl p-6 bg-neutral-950 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt="Current reseller logo"
                    className="max-h-32 max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Upload Zone */}
            <div>
              <label htmlFor="logo-upload" className="block">
                <div
                  className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
                    uploading
                      ? 'border-orange-500/50 bg-orange-500/5'
                      : uploadStatus === 'success'
                      ? 'border-green-500 bg-green-500/5'
                      : uploadStatus === 'error'
                      ? 'border-red-500 bg-red-500/5'
                      : 'border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-950'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    {uploading ? (
                      <>
                        <Loader2 size={48} className="mb-4 text-orange-500 animate-spin" />
                        <p className="text-lg font-semibold text-white mb-1">Uploading...</p>
                        <p className="text-sm text-neutral-400">Please wait while we upload your logo</p>
                      </>
                    ) : uploadStatus === 'success' ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                          <Check size={24} className="text-green-500" />
                        </div>
                        <p className="text-lg font-semibold text-green-500 mb-1">Upload Successful!</p>
                        <p className="text-sm text-neutral-400">Your logo has been updated</p>
                      </>
                    ) : uploadStatus === 'error' ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                          <X size={24} className="text-red-500" />
                        </div>
                        <p className="text-lg font-semibold text-red-500 mb-1">Upload Failed</p>
                        <p className="text-sm text-neutral-400">{errorMessage}</p>
                        <p className="text-xs text-neutral-500 mt-2">Click to try again</p>
                      </>
                    ) : (
                      <>
                        <Upload
                          size={48}
                          className="mb-4 text-neutral-500 group-hover:text-orange-500 transition-colors"
                        />
                        <p className="text-lg font-semibold text-white mb-1">
                          {logoUrl ? 'Upload New Logo' : 'Upload Business Logo'}
                        </p>
                        <p className="text-sm text-neutral-400">PNG, JPG, SVG (Max 2MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>

            {/* Upload Instructions */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Logo Guidelines</h4>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>• Recommended size: 500x500px or larger</li>
                <li>• Transparent background (PNG) works best</li>
                <li>• High contrast logos are more visible on product packaging</li>
                <li>• Maximum file size: 2MB</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
