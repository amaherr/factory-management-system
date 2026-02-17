import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Search, Undo } from 'lucide-react';
import { toast } from 'sonner';

export function ReturnsAdjustments() {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [reason, setReason] = useState('');
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');

  const handleProcessReturn = () => {
    if (!selectedInvoice) {
      toast.error('Please select an invoice');
      return;
    }
    toast.success('Return processed successfully');
    // Reset form
    setSelectedInvoice('');
    setReason('');
    setCondition('');
    setNotes('');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Returns & Adjustments</h1>
        <p className="text-gray-500">Process customer returns and inventory adjustments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Process Return</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Invoice</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Enter invoice number..."
                  className="pl-10"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Return Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="size">Size Issue</SelectItem>
                  <SelectItem value="defect">Product Defect</SelectItem>
                  <SelectItem value="wrong">Wrong Item</SelectItem>
                  <SelectItem value="damaged">Damaged in Transit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock (Good Condition)</SelectItem>
                  <SelectItem value="damaged">Damaged (Cannot Restock)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes about the return..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button className="w-full" onClick={handleProcessReturn}>
              <Undo className="size-4 mr-2" />
              Process Return
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Adjustment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Admin/Inventory Only:</strong> Manual adjustments should include a detailed reason and are logged for audit purposes.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Product/Variant</Label>
              <Input placeholder="Search product..." />
            </div>

            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock (+)</SelectItem>
                  <SelectItem value="remove">Remove Stock (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" placeholder="0" min="1" />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea placeholder="Reason for adjustment..." rows={3} />
            </div>

            <Button className="w-full">Submit Adjustment</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No returns processed yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
