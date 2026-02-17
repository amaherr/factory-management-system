import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { StatusBadge } from '../../components/ui/status-badge';
import { Factory, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export function ColorGuide() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Color System Guide</h1>
        <p style={{ color: 'var(--text-muted)' }}>Professional Industrial Theme - Design Reference</p>
      </div>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Core Brand Palette</CardTitle>
          <CardDescription>Primary, Accent, and Secondary colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary - Deep Steel Blue */}
          <div>
            <h3 className="font-medium mb-3">🔷 Primary - Deep Steel Blue</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg" style={{ backgroundColor: 'var(--primary-600)' }} />
                <p className="text-sm font-medium">Primary 600</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#1E3A5F</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg" style={{ backgroundColor: 'var(--primary-500)' }} />
                <p className="text-sm font-medium">Primary 500 (Main)</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#254E7B</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg" style={{ backgroundColor: 'var(--primary-400)' }} />
                <p className="text-sm font-medium">Primary 400</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#3A6A9E</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border" style={{ backgroundColor: 'var(--primary-100)' }} />
                <p className="text-sm font-medium">Primary 100</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#E6EEF5</p>
              </div>
            </div>
          </div>

          {/* Accent - Industrial Orange */}
          <div>
            <h3 className="font-medium mb-3">🔶 Accent - Industrial Orange</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg" style={{ backgroundColor: 'var(--accent-600)' }} />
                <p className="text-sm font-medium">Accent 600</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#C05600</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg" style={{ backgroundColor: 'var(--accent-500)' }} />
                <p className="text-sm font-medium">Accent 500 (Main)</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#E67E22</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border" style={{ backgroundColor: 'var(--accent-100)' }} />
                <p className="text-sm font-medium">Accent 100</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#FFF3E8</p>
              </div>
            </div>
          </div>

          {/* Secondary - Production Green */}
          <div>
            <h3 className="font-medium mb-3">🟢 Secondary - Production Green</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg" style={{ backgroundColor: 'var(--green-600)' }} />
                <p className="text-sm font-medium">Green 600</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#1E7F4F</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg" style={{ backgroundColor: 'var(--green-500)' }} />
                <p className="text-sm font-medium">Green 500 (Main)</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#27AE60</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border" style={{ backgroundColor: 'var(--green-100)' }} />
                <p className="text-sm font-medium">Green 100</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#E9F7EF</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Functional Status Colors */}
      <Card>
        <CardHeader>
          <CardTitle>🚦 Functional Status Colors</CardTitle>
          <CardDescription>Success, Error, Warning, and Info states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--success-bg)' }}>
                <CheckCircle2 className="size-8" style={{ color: 'var(--success-main)' }} />
              </div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#27AE60</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--error-bg)' }}>
                <XCircle className="size-8" style={{ color: 'var(--error-main)' }} />
              </div>
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#E74C3C</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--warning-bg)' }}>
                <AlertTriangle className="size-8" style={{ color: 'var(--warning-main)' }} />
              </div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#F39C12</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--info-bg)' }}>
                <Info className="size-8" style={{ color: 'var(--info-main)' }} />
              </div>
              <p className="text-sm font-medium">Info</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#3498DB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Examples */}
      <Card>
        <CardHeader>
          <CardTitle>🧩 Component Examples</CardTitle>
          <CardDescription>UI components using the color system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div>
            <h3 className="font-medium mb-3">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Primary Button</Button>
              <Button variant="accent">Accent Button (Finalize)</Button>
              <Button variant="outline">Secondary Button</Button>
              <Button variant="destructive">Delete Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="font-medium mb-3">Status Badges</h3>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="completed" />
              <StatusBadge status="in-progress" />
              <StatusBadge status="pending" />
              <StatusBadge status="cancelled" />
              <StatusBadge status="draft" />
              <StatusBadge status="low-stock" />
            </div>
          </div>

          {/* Badge Variants */}
          <div>
            <h3 className="font-medium mb-3">Badge Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Neutral Colors */}
      <Card>
        <CardHeader>
          <CardTitle>🧱 Neutral System Scale</CardTitle>
          <CardDescription>Backgrounds, borders, and typography colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backgrounds */}
          <div>
            <h3 className="font-medium mb-3">Backgrounds</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg border" style={{ backgroundColor: 'var(--bg-primary)' }} />
                <p className="text-sm font-medium">Background Primary</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#F7F9FC</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)' }} />
                <p className="text-sm font-medium">Card Background</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#FFFFFF</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg" style={{ backgroundColor: 'var(--bg-sidebar)' }} />
                <p className="text-sm font-medium">Sidebar</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#1E3A5F</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border" style={{ backgroundColor: 'var(--bg-hover-row)' }} />
                <p className="text-sm font-medium">Hover Row</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#F1F4F8</p>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div>
            <h3 className="font-medium mb-3">Typography</h3>
            <div className="space-y-2">
              <p style={{ color: 'var(--text-heading)' }}>Heading Text (#1F2937)</p>
              <p style={{ color: 'var(--text-body)' }}>Body Text (#374151)</p>
              <p style={{ color: 'var(--text-muted)' }}>Muted Text (#6B7280)</p>
              <p style={{ color: 'var(--text-disabled)' }}>Disabled Text (#9CA3AF)</p>
            </div>
          </div>

          {/* Borders */}
          <div>
            <h3 className="font-medium mb-3">Borders</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg" style={{ border: '2px solid var(--border-light)' }}>
                <p className="text-sm">Light Border</p>
              </div>
              <div className="p-4 rounded-lg" style={{ border: '2px solid var(--border-default)' }}>
                <p className="text-sm">Default Border</p>
              </div>
              <div className="p-4 rounded-lg" style={{ border: '2px solid var(--border-strong)' }}>
                <p className="text-sm">Strong Border</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Colors */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Analytics & Chart Colors</CardTitle>
          <CardDescription>Colors for data visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { name: 'Blue', var: '--chart-blue', hex: '#3A6A9E' },
              { name: 'Orange', var: '--chart-orange', hex: '#E67E22' },
              { name: 'Green', var: '--chart-green', hex: '#27AE60' },
              { name: 'Purple', var: '--chart-purple', hex: '#8E44AD' },
              { name: 'Teal', var: '--chart-teal', hex: '#16A085' },
              { name: 'Red', var: '--chart-red', hex: '#E74C3C' },
              { name: 'Yellow', var: '--chart-yellow', hex: '#F1C40F' },
            ].map((color) => (
              <div key={color.name} className="space-y-2">
                <div className="h-16 rounded-lg" style={{ backgroundColor: `var(${color.var})` }} />
                <p className="text-sm font-medium">{color.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{color.hex}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Factory className="size-4" style={{ color: 'var(--primary-500)' }} />
              Primary Blue (#254E7B)
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Used for: Headers, primary buttons, navigation, brand elements
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--accent-500)' }}>
              🔶 Accent Orange (#E67E22)
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Used for: Primary CTAs (Finalize, Create Batch, Export), active states, highlighted KPIs
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--success-main)' }}>
              ✅ Production Green (#27AE60)
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Used for: Completed batches, successful transactions, positive metrics
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--warning-main)' }}>
              ⚠️ Warning Orange (#F39C12)
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Used for: Low stock alerts, editing warnings, batch loss alerts
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--error-main)' }}>
              ❌ Error Red (#E74C3C)
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Used for: Stock unavailable, validation errors, failed actions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
