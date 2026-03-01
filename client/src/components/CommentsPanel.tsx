import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Edit, Trash2, Reply, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CommentsPanelProps {
  entityType: string;
  entityId: number;
  projectId: number;
}

export function CommentsPanel({ entityType, entityId, projectId }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const { data: commentsList, refetch } = trpc.comments.list.useQuery(
    { entityType, entityId, projectId },
    { enabled: !!projectId && !!entityId }
  );

  const createMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      setReplyingTo(null);
      setReplyText("");
      refetch();
      toast.success("Comment added");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.comments.update.useMutation({
    onSuccess: () => {
      setEditingId(null);
      setEditText("");
      refetch();
      toast.success("Comment updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Comment deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createMutation.mutate({ projectId, entityType, entityId, body: newComment.trim() });
  };

  const handleReply = (parentId: number) => {
    if (!replyText.trim()) return;
    createMutation.mutate({ projectId, entityType, entityId, body: replyText.trim(), parentCommentId: parentId });
  };

  const handleUpdate = (id: number) => {
    if (!editText.trim()) return;
    updateMutation.mutate({ id, body: editText.trim() });
  };

  // Build threaded structure
  const topLevel = commentsList?.filter(c => !c.parentCommentId) || [];
  const replies = commentsList?.filter(c => c.parentCommentId) || [];
  const getReplies = (parentId: number) => replies.filter(r => r.parentCommentId === parentId);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const renderComment = (comment: any, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} py-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
            {(comment.authorName || '?')[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
        </div>
        <div className="flex items-center gap-1">
          {!isReply && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(""); }}>
              <Reply className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingId(comment.id); setEditText(comment.body); }}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => deleteMutation.mutate({ id: comment.id })}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {editingId === comment.id ? (
        <div className="mt-2 space-y-2">
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[60px] text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleUpdate(comment.id)} disabled={updateMutation.isPending}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
      )}
      {replyingTo === comment.id && (
        <div className="mt-2 ml-8 space-y-2">
          <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="min-h-[60px] text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleReply(comment.id)} disabled={createMutation.isPending}>
              <Send className="h-3 w-3 mr-1" /> Reply
            </Button>
            <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
          </div>
        </div>
      )}
      {getReplies(comment.id).map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-medium text-gray-900">Comments ({commentsList?.length || 0})</h4>
      </div>

      <div className="space-y-1 divide-y divide-gray-100">
        {topLevel.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No comments yet.</p>
        ) : (
          topLevel.map(c => renderComment(c))
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[60px] text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
        />
        <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim() || createMutation.isPending} className="self-end">
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
