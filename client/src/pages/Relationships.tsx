import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, GitBranch, FileText, CheckSquare, AlertCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Relationships() {
  const { data: relationships, isLoading } = trpc.relationships.getAll.useQuery();

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
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Entity Relationships
          </CardTitle>
          <CardDescription>
            Hierarchical view of requirements linked to tasks and issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relationships && relationships.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {relationships.map((rel, index) => (
                <AccordionItem key={rel.requirement.id} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 w-full">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-semibold">{rel.requirement.idCode}</span>
                      <span className="text-sm text-muted-foreground truncate flex-1 text-left">
                        {rel.requirement.description}
                      </span>
                      <div className="flex gap-2">
                        {rel.tasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckSquare className="w-3 h-3 mr-1" />
                            {rel.tasks.length} {rel.tasks.length === 1 ? 'Task' : 'Tasks'}
                          </Badge>
                        )}
                        {rel.issues.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {rel.issues.length} {rel.issues.length === 1 ? 'Issue' : 'Issues'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-8 space-y-4 pt-4">
                      {rel.tasks.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-green-600" />
                            Related Tasks
                          </h4>
                          <div className="space-y-2">
                            {rel.tasks.map((task) => (
                              <Card key={task.id} className="bg-muted/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <Badge variant="outline" className="font-mono">
                                      {task.taskId}
                                    </Badge>
                                    <div className="flex-1">
                                      <p className="text-sm">{task.description}</p>
                                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>Responsible: {task.responsible || 'N/A'}</span>
                                        <span>Due: {task.dueDate || 'N/A'}</span>
                                        <span>Status: {task.currentStatus || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {rel.issues.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            Related Issues
                          </h4>
                          <div className="space-y-2">
                            {rel.issues.map((issue) => (
                              <Card key={issue.id} className="bg-muted/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <Badge variant="outline" className="font-mono">
                                      {issue.issueId}
                                    </Badge>
                                    <div className="flex-1">
                                      <p className="text-sm">{issue.description}</p>
                                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>Owner: {issue.owner || 'N/A'}</span>
                                        <span>Priority: {issue.priority || 'N/A'}</span>
                                        <span>Status: {issue.status || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {rel.tasks.length === 0 && rel.issues.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No tasks or issues linked to this requirement
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No relationships found.</p>
              <p className="text-sm mt-2">
                Import data and ensure requirements have linked tasks or issues.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relationship Summary</CardTitle>
          <CardDescription>
            Overview of entity connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">
                  {relationships?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Requirements with Links
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">
                  {relationships?.reduce((sum, rel) => sum + rel.tasks.length, 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Linked Tasks
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">
                  {relationships?.reduce((sum, rel) => sum + rel.issues.length, 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Linked Issues
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
