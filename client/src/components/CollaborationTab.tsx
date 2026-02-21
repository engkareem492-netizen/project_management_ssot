import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Mail, Link as LinkIcon, Copy, Trash2, UserPlus, Share2 } from "lucide-react";

interface CollaborationTabProps {
  projectId: number;
}

export default function CollaborationTab({ projectId }: CollaborationTabProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [shareLinkDialogOpen, setShareLinkDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [sharePassword, setSharePassword] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: members, isLoading: membersLoading } = trpc.collaboration.getProjectMembers.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: pendingInvitations, isLoading: invitationsLoading } = trpc.collaboration.getPendingInvitations.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  // Mutations
  const inviteUserMutation = trpc.collaboration.inviteUserByEmail.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.collaboration.getPendingInvitations.invalidate();
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("editor");
      
      // Show invitation link for testing
      if (data.invitationLink) {
        toast.info(`Invitation link (for testing): ${data.invitationLink}`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = trpc.collaboration.removeMember.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.collaboration.getProjectMembers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelInvitationMutation = trpc.collaboration.cancelInvitation.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.collaboration.getPendingInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateShareLinkMutation = trpc.collaboration.generateShareableLink.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setGeneratedLink(data.shareLink);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInviteUser = () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    inviteUserMutation.mutate({
      projectId,
      email: inviteEmail,
      role: inviteRole,
    });
  };

  const handleGenerateShareLink = () => {
    if (!sharePassword || sharePassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    generateShareLinkMutation.mutate({
      projectId,
      password: sharePassword,
    });
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard");
    }
  };

  const handleRemoveMember = (memberId: number, userName: string) => {
    if (confirm(`Remove ${userName} from this project?`)) {
      removeMemberMutation.mutate({
        projectId,
        memberId,
      });
    }
  };

  const handleCancelInvitation = (invitationId: number, email: string) => {
    if (confirm(`Cancel invitation for ${email}?`)) {
      cancelInvitationMutation.mutate({ invitationId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Project Members
              </CardTitle>
              <CardDescription>
                Manage who has access to this project
              </CardDescription>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <p className="text-muted-foreground">Loading members...</p>
          ) : members && members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.userName || "Unknown"}</TableCell>
                    <TableCell>{member.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, (member.userName || member.userEmail) ?? "Unknown")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No members yet. Invite someone to collaborate!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Shareable Link */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Shareable Project Link
              </CardTitle>
              <CardDescription>
                Generate a password-protected link that anyone can use to join
              </CardDescription>
            </div>
            <Button onClick={() => setShareLinkDialogOpen(true)}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Generate Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create a shareable link with a password. Anyone with the link and password can join as a viewer.
          </p>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation to collaborate on this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as "editor" | "viewer")}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor - Can edit and manage content</SelectItem>
                  <SelectItem value="viewer">Viewer - Can only view content</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={inviteUserMutation.isPending}>
              {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Share Link Dialog */}
      <Dialog open={shareLinkDialogOpen} onOpenChange={setShareLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Shareable Link</DialogTitle>
            <DialogDescription>
              Create a password-protected link for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-password">Project Password</Label>
              <Input
                id="share-password"
                type="password"
                placeholder="Enter a secure password (min 6 characters)"
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Anyone with this link and password can join as a viewer
              </p>
            </div>
            {generatedLink && (
              <div className="space-y-2">
                <Label>Generated Link</Label>
                <div className="flex gap-2">
                  <Input value={generatedLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShareLinkDialogOpen(false);
              setSharePassword("");
              setGeneratedLink("");
            }}>
              Close
            </Button>
            {!generatedLink && (
              <Button onClick={handleGenerateShareLink} disabled={generateShareLinkMutation.isPending}>
                {generateShareLinkMutation.isPending ? "Generating..." : "Generate Link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
