import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export function SystemSettings() {
  const [companyName, setCompanyName] = useState('Factory System');
  const [companyAddress, setCompanyAddress] = useState('123 Industrial St, Cairo, Egypt');
  const [companyPhone, setCompanyPhone] = useState('+20 2 1234 5678');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [defaultTax, setDefaultTax] = useState('14');

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">System Settings</h1>
        <p className="text-gray-500">Configure system-wide settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-address">Address</Label>
            <Input
              id="company-address"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-phone">Phone</Label>
            <Input
              id="company-phone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
            <Input
              id="invoice-prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="INV"
            />
            <p className="text-sm text-gray-500">
              Format: {invoicePrefix}-YYYY-001
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-tax">Default Tax Rate (%)</Label>
            <Input
              id="default-tax"
              type="number"
              value={defaultTax}
              onChange={(e) => setDefaultTax(e.target.value)}
              min="0"
              max="100"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-500">Upload logo for invoice headers</p>
              <Button variant="outline" className="mt-4">
                Choose File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave}>
          <Save className="size-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
