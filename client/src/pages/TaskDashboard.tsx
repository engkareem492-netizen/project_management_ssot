import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function TaskDashboard() {
  const { currentProjectId } = useProject();
  const { data: tasks = [] } = trpc.tasks.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });

  // Group tasks by Responsible
  const tasksByResponsible = useMemo(() => {
    const grouped: Record<string, { count: number; byStatus: Record<string, number> }> = {};

    tasks.forEach((task) => {
      const responsible = task.responsible || "Unassigned";
      if (!grouped[responsible]) {
        grouped[responsible] = { count: 0, byStatus: {} };
      }
      grouped[responsible].count++;

      const status = task.currentStatus || "Open";
      grouped[responsible].byStatus[status] = (grouped[responsible].byStatus[status] || 0) + 1;
    });

    return grouped;
  }, [tasks]);

  // Prepare data for bar chart
  const chartData = useMemo(() => {
    return Object.entries(tasksByResponsible).map(([responsible, data]) => ({
      responsible,
      count: data.count,
    }));
  }, [tasksByResponsible]);

  // Prepare data for status distribution
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    tasks.forEach((task) => {
      const status = task.currentStatus || "Open";
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [tasks]);

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Tasks</div>
          <div className="text-3xl font-bold">{tasks.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Responsible Persons</div>
          <div className="text-3xl font-bold">{Object.keys(tasksByResponsible).length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Average Tasks/Person</div>
          <div className="text-3xl font-bold">
            {Object.keys(tasksByResponsible).length > 0
              ? (tasks.length / Object.keys(tasksByResponsible).length).toFixed(1)
              : 0}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Responsible */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tasks by Responsible</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="responsible" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Breakdown by Responsible</h3>
        <div className="space-y-4">
          {Object.entries(tasksByResponsible).map(([responsible, data]) => (
            <div key={responsible} className="border rounded-lg p-4">
              <div className="font-semibold mb-2">{responsible}</div>
              <div className="text-sm text-muted-foreground mb-2">Total: {data.count} tasks</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.byStatus).map(([status, count]) => (
                  <div key={status} className="bg-secondary px-3 py-1 rounded text-sm">
                    {status}: <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
