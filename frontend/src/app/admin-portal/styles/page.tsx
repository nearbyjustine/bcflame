'use client';

import { useRouter } from 'next/navigation';
import { Palette, Type, Plus, Layers, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StylesPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Style Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage backgrounds, fonts, and visual effects for product customization
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Background Styles Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin-portal/styles/backgrounds')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Background Styles</CardTitle>
                  <CardDescription>Manage colors, gradients, textures, and images</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Style Types:</span>
                <span className="font-medium">Solid • Gradient • Texture • Image</span>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/admin-portal/styles/backgrounds');
                  }}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  View All
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/admin-portal/styles/backgrounds/new');
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Font Styles Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin-portal/styles/fonts')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Type className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Font Styles</CardTitle>
                  <CardDescription>Manage typography for product labels</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Categories:</span>
                <span className="font-medium">Sans Serif • Serif • Display • Script</span>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/admin-portal/styles/fonts');
                  }}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  View All
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/admin-portal/styles/fonts/new');
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Effects Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin-portal/styles/effects')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Visual Effects</CardTitle>
                  <CardDescription>Manage CSS-based effects and filters</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Categories:</span>
                <span className="font-medium">Text • BG • Filter • UI</span>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/admin-portal/styles/effects');
                  }}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  View All
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/admin-portal/styles/effects/new');
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common style management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/admin-portal/styles/backgrounds/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Background
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/admin-portal/styles/fonts/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Font
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/admin-portal/styles/effects/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Effect
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/admin-portal/styles/backgrounds')}
            >
              <Palette className="mr-2 h-4 w-4" />
              Browse Backgrounds
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/admin-portal/styles/fonts')}
            >
              <Type className="mr-2 h-4 w-4" />
              Browse Fonts
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/admin-portal/styles/effects')}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Browse Effects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
