import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function Dependencies() {
  const { data: dependencies, isLoading } = trpc.dependencies.list.useQuery();

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
          <CardTitle>Dependencies</CardTitle>
          <CardDescription>
            View project dependencies and their relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dependency ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Requirement ID</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependencies?.map((dep) => (
                  <TableRow key={dep.id}>
                    <TableCell className="font-medium">{dep.dependencyId}</TableCell>
                    <TableCell className="max-w-xs truncate">{dep.description}</TableCell>
                    <TableCell>{dep.taskId || 'N/A'}</TableCell>
                    <TableCell>{dep.requirementId || 'N/A'}</TableCell>
                    <TableCell>{dep.responsible}</TableCell>
                    <TableCell>{dep.dueDate || 'N/A'}</TableCell>
                    <TableCell>{dep.currentStatus || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {dependencies?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No dependencies found. Import an Excel file to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
