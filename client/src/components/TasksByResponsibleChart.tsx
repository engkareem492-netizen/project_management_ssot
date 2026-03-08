import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Task {
  id: number;
  taskId: string;
  description?: string | null;
  responsible?: string | null;
  assignDate?: string | null;
  dueDate?: string | null;
  status?: string | null;
  requirementId?: string | number | null;
  requirement?: { requirementId: string } | null;
  issues?: Array<{ issueId: string }>;
  [key: string]: any; // Allow additional properties from database
}

interface TasksByResponsibleChartProps {
  tasks: Task[];
  selectedResponsible?: string | null;
  onResponsibleSelect?: (name: string) => void;
}

export function TasksByResponsibleChart({ tasks, selectedResponsible: externalSelected, onResponsibleSelect }: TasksByResponsibleChartProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  // Use external state if provided (controlled mode), otherwise use internal state
  const selectedResponsible = externalSelected !== undefined ? externalSelected : internalSelected;

  // Group tasks by responsible person
  const chartData = useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      const responsible = task.responsible || 'Unassigned';
      if (!acc[responsible]) {
        acc[responsible] = 0;
      }
      acc[responsible]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  // Filter tasks for selected responsible person
  const filteredTasks = useMemo(() => {
    if (!selectedResponsible) return [];
    return tasks.filter(task => (task.responsible || 'Unassigned') === selectedResponsible);
  }, [tasks, selectedResponsible]);

  const handleBarClick = (data: any) => {
    const name: string = data.name;
    if (onResponsibleSelect) {
      // Controlled mode: toggle via parent
      onResponsibleSelect(name);
    } else {
      // Uncontrolled mode: toggle internally
      setInternalSelected(prev => prev === name ? null : name);
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('complete') || statusLower.includes('done') || statusLower.includes('closed')) {
      return 'default';
    }
    if (statusLower.includes('progress') || statusLower.includes('active')) {
      return 'secondary';
    }
    if (statusLower.includes('blocked') || statusLower.includes('hold')) {
      return 'destructive';
    }
    return 'outline';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      // Parse ISO date strings (YYYY-MM-DD) directly to avoid UTC timezone shift
      const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return String(dateString);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Responsible Person</CardTitle>
          <CardDescription>
            Click on any bar to view detailed tasks for that person
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))"
                cursor="pointer"
                onClick={(data: any) => handleBarClick(data)}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.name === selectedResponsible ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {selectedResponsible && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tasks for {selectedResponsible}</CardTitle>
                <CardDescription>
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} assigned
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (onResponsibleSelect && selectedResponsible) onResponsibleSelect(selectedResponsible);
                  else setInternalSelected(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Requirement</TableHead>
                    <TableHead>Linked Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.taskId}</TableCell>
                        <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                        <TableCell>{formatDate(task.assignDate)}</TableCell>
                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(task.status)}>
                            {task.status || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.requirement?.requirementId || '-'}
                        </TableCell>
                        <TableCell>
                          {task.issues && task.issues.length > 0
                            ? task.issues.map(issue => issue.issueId).join(', ')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
