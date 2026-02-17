import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Search, Eye } from 'lucide-react';
import { mockTransactions } from '../../lib/mockData';

export function TransactionsLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Inventory Transactions Log</h1>
        <p className="text-gray-500">Complete audit trail of all stock movements</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search by product or reference..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="production-in">Production In</SelectItem>
                <SelectItem value="sale-out">Sale Out</SelectItem>
                <SelectItem value="return-in">Return In</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
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
                <TableHead>Timestamp</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product/Variant</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.productName}</p>
                      <p className="text-sm text-gray-500">{transaction.variantDetails}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.quantity > 0 ? 'default' : 'destructive'}>
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {transaction.fromLocation && transaction.toLocation
                      ? `${transaction.fromLocation} → ${transaction.toLocation}`
                      : transaction.toLocation || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{transaction.reference || '-'}</TableCell>
                  <TableCell>{transaction.performedBy}</TableCell>
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
