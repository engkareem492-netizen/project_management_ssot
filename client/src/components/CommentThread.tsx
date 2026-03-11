import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Send, Loader2, Trash2, Edit, X, Check } from "lucide-react";

interface CommentThreadProps {
  entityType: string;
  entityId: string;
  authorName?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CommentThread({ entityType, entityId, authorName }: CommentThreadProps) {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId && !!entityId;

  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: commentsList = [], isLoading, refetch } = trpc.comments.list.useQuery(
    { projectId, entityType, entityId },
    { enabled }
  );

  const createMut = trpc.comments.create.useMutation({
    onSuccess: () => { refetch(); setNewComment(""); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.comments.update.useMutation({
    onSuccess: () => { refetch(); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.comments.delete.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit() {
    if (!newComment.trim()) return;
    createMut.mutate({ projectId, entityType, entityId, content: newComment.trim(), authorName: authorName || "User" });
  }

  if (!currentProjectId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <MessageSquare className="w-4 h-4" />
        Comments {commentsList.length > 0 && <span className="bg-muted rounded-full px-1.5 py-0.5 text-xs">{commentsList.length}</span>}
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>
      ) : commentsList.length === 0 ? (
        <div className="text-xs text-muted-foreground py-2">No comments yet. Be the first to comment.</div>
      ) : (
        <div className="space-y-2">
          {[...commentsList].reverse().map((comment: any) => (
            <div key={comment.id} className="bg-muted/30 rounded-lg px-3 py-2.5 group">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {(comment.authorName || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold">{comment.authorName || "Anonymous"}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm("Delete comment?")) deleteMut.mutate({ id: comment.id }); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {editingId === comment.id ? (
                <div className="space-y-1.5">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="text-sm min-h-[60px]"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-6 text-xs px-2" disabled={!editContent.trim() || updateMut.isPending} onClick={() => updateMut.mutate({ id: comment.id, content: editContent.trim() })}>
                      <Check className="w-3 h-3 mr-1" />Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>
                      <X className="w-3 h-3 mr-1" />Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[60px] text-sm resize-none flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="sm"
          className="self-end h-8"
          disabled={!newComment.trim() || createMut.isPending}
          onClick={handleSubmit}
        >
          {createMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Ctrl+Enter to submit</p>
    </div>
  );
}
