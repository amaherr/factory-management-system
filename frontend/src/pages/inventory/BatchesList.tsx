import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Search, Plus, Eye } from 'lucide-react';
import { mockBatches } from '../../lib/mockData';

export function BatchesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredBatches = mockBatches.filter(batch => {
    const matchesSearch = batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         batch.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Batches & Production</h1>
          <p className="text-gray-500">Track production batches from planning to completion</p>
        </div>
        <Button>
          <Plus className="size-4 mr-2" />
          Create Batch
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search batches..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>Product / Variant</TableHead>
                <TableHead>Planned Qty</TableHead>
                <TableHead>Produced Qty</TableHead>
                <TableHead>Loss Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{batch.productName}</p>
                      <p className="text-sm text-gray-500">{batch.variantDetails}</p>
                    </div>
                  </TableCell>
                  <TableCell>{batch.plannedQty}</TableCell>
                  <TableCell>{batch.producedQty}</TableCell>
                  <TableCell>
                    {batch.lossQty > 0 && (
                      <Badge variant="destructive">{batch.lossQty}</Badge>
                    )}
                    {batch.lossQty === 0 && <span>0</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        batch.status === 'completed' ? 'default' :
                        batch.status === 'in-progress' ? 'default' :
                        batch.status === 'planning' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(batch.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{batch.endDate ? new Date(batch.endDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
