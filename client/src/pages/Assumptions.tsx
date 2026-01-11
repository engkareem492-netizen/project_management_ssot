import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function Assumptions() {
  const { data: assumptions, isLoading } = trpc.assumptions.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assumptions</CardTitle>
          <CardDescription>
            View project assumptions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assumption ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assumptions?.map((assumption) => (
                  <TableRow key={assumption.id}>
                    <TableCell className="font-medium">{assumption.assumptionId}</TableCell>
                    <TableCell className="max-w-md truncate">{assumption.description}</TableCell>
                    <TableCell>{assumption.category || 'N/A'}</TableCell>
                    <TableCell>{assumption.owner}</TableCell>
                    <TableCell>{assumption.status || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {assumptions?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No assumptions found. Import an Excel file to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
