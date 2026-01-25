import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function ActionLog() {
  const { data: actionLogs, isLoading } = trpc.actionLogs.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getEntityTypeColor = (type: string) => {
    if (type === "requirement") return "default";
    if (type === "task") return "secondary";
    if (type === "issue") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Action Log</CardTitle>
          <CardDescription>
            Complete history of all changes made to requirements, tasks, and issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Changed Fields</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {new Date(log.changedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEntityTypeColor(log.entityType)}>
                        {log.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{log.entityId}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(log.changedFields as Record<string, any>).map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {Object.entries(log.changedFields as Record<string, { oldValue: any; newValue: any }>).map(([field, change]) => (
                          <div key={field} className="flex gap-2">
                            <span className="text-muted-foreground line-through">
                              {String(change.oldValue || 'empty').substring(0, 30)}
                            </span>
                            <span>→</span>
                            <span className="text-green-600 font-medium">
                              {String(change.newValue || 'empty').substring(0, 30)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {actionLogs?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No changes recorded yet. Start editing requirements, tasks, or issues to see the action log.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
