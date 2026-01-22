"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import {
  Users,
  Shield,
  Calendar,
  Loader2,
  Trash2,
  Box,
} from "lucide-react";
import {
  useGroup,
  useGroupMembers,
  useGroupPermissionSets,
  useGroupAssets,
  useUpdateGroup,
  useAddGroupMember,
  useRemoveGroupMember,
  useAssignPermissionSetToGroup,
  useAssignAssetToGroup,
  useUnassignPermissionSetFromGroup,
  useUnassignAssetFromGroup,
  usePermissionSets,
  type GroupMemberRole,
  formatDate,
} from "@/features/access-control";
import { useMembers } from "@/features/organization";
import { useTenant } from "@/context/tenant-provider";

import {
  GroupHeader,
  OverviewTab,
  MembersTab,
  PermissionsTab,
  AssetsTab,
  ErrorDisplay,
  AddMemberDialog,
  AddPermissionSetDialog,
  AddAssetDialog,
} from "./group-detail-sheet/index";

interface GroupDetailSheetProps {
  groupId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function GroupDetailSheet({
  groupId,
  open,
  onOpenChange,
  onUpdate,
}: GroupDetailSheetProps) {
  const { currentTenant } = useTenant();
  const tenantSlug = currentTenant?.slug;

  // API Hooks
  const { group, isLoading: groupLoading, isError: groupError, error: groupErrorDetails, mutate: mutateGroup } = useGroup(groupId);
  const { members, isLoading: membersLoading, mutate: mutateMembers } = useGroupMembers(groupId);
  const { permissionSets: groupPermissionSets, isLoading: permissionsLoading, mutate: mutatePermissionSets } = useGroupPermissionSets(groupId);
  const { updateGroup, isUpdating } = useUpdateGroup(groupId);
  const { addMember, isAdding: isAddingMember } = useAddGroupMember(groupId);
  const { permissionSets: allPermissionSets } = usePermissionSets({ limit: 100, is_system: true });
  const { members: tenantMembers } = useMembers(tenantSlug);
  const { assignPermissionSet, isAssigning } = useAssignPermissionSetToGroup(groupId);
  const { assets, isLoading: assetsLoading, mutate: mutateAssets } = useGroupAssets(groupId);
  const { assignAsset, isAssigning: isAssigningAsset } = useAssignAssetToGroup(groupId);

  // UI State
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addPermissionDialogOpen, setAddPermissionDialogOpen] = useState(false);
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);
  const [permissionToRemove, setPermissionToRemove] = useState<{ id: string; name: string } | null>(null);
  const [assetToRemove, setAssetToRemove] = useState<{ id: string; name: string } | null>(null);
  const [newMember, setNewMember] = useState({ userId: "", role: "member" as GroupMemberRole });
  const [newPermissionSetId, setNewPermissionSetId] = useState("");

  // Remove hooks
  const { removeMember, isRemoving: isRemovingMember } = useRemoveGroupMember(
    groupId,
    memberToRemove?.userId || null
  );
  const { unassignPermissionSet, isUnassigning } = useUnassignPermissionSetFromGroup(
    groupId,
    permissionToRemove?.id || null
  );
  const { unassignAsset, isUnassigning: isUnassigningAsset } = useUnassignAssetFromGroup(
    groupId,
    assetToRemove?.id || null
  );

  // Force revalidate when sheet opens to avoid stale cache
  useEffect(() => {
    if (open && groupId) {
      mutateGroup();
      mutateAssets();
    }
  }, [open, groupId, mutateGroup, mutateAssets]);

  // Log errors for debugging
  useEffect(() => {
    if (groupError && groupErrorDetails) {
      console.error('[GroupDetailSheet] Failed to load group:', {
        groupId,
        error: groupErrorDetails,
        timestamp: new Date().toISOString(),
      });
    }
  }, [groupError, groupErrorDetails, groupId]);

  // Start editing
  const handleStartEdit = useCallback(() => {
    if (group) {
      setEditForm({
        name: group.name,
        description: group.description || "",
      });
      setIsEditing(true);
    }
  }, [group]);

  // Save changes
  const handleSaveChanges = async () => {
    if (!editForm.name) {
      toast.error("Group name is required");
      return;
    }

    try {
      await updateGroup({
        name: editForm.name,
        description: editForm.description || undefined,
      });
      toast.success("Group updated successfully");
      setIsEditing(false);
      mutateGroup();
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to update group: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Add member
  const handleAddMember = async () => {
    if (!newMember.userId) {
      toast.error("Please select a member");
      return;
    }

    try {
      await addMember({
        user_id: newMember.userId,
        role: newMember.role,
      });
      toast.success("Member added successfully");
      setAddMemberDialogOpen(false);
      setNewMember({ userId: "", role: "member" });
      mutateMembers();
      mutateGroup();
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to add member: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Remove member
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember();
      toast.success(`Member removed successfully`);
      setMemberToRemove(null);
      mutateMembers();
      mutateGroup();
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to remove member: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Assign permission set
  const handleAssignPermissionSet = async () => {
    if (!newPermissionSetId) {
      toast.error("Please select a permission set");
      return;
    }

    try {
      await assignPermissionSet({
        permission_set_id: newPermissionSetId,
      });
      toast.success("Permission set assigned successfully");
      setAddPermissionDialogOpen(false);
      setNewPermissionSetId("");
      mutatePermissionSets();
      mutateGroup();
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to assign permission set: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Unassign permission set
  const handleUnassignPermissionSet = async () => {
    if (!permissionToRemove) return;

    try {
      await unassignPermissionSet();
      toast.success("Permission set removed successfully");
      setPermissionToRemove(null);
      mutatePermissionSets();
      mutateGroup();
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to remove permission set: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Assign Asset
  const handleAssignAsset = async (assetId: string, ownershipType: "primary" | "shared") => {
    try {
      await assignAsset({
        asset_id: assetId,
        ownership_type: ownershipType,
      });
      toast.success("Asset assigned successfully");
      setAddAssetDialogOpen(false);
      mutateAssets();
      mutateGroup();
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to assign asset: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Unassign Asset
  const handleUnassignAsset = async () => {
    if (!assetToRemove) return;

    try {
      await unassignAsset();
      toast.success("Asset removed successfully");
      setAssetToRemove(null);
      mutateAssets();
      mutateGroup();
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to remove asset: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Get available members (not already in group)
  const availableMembers = (tenantMembers || []).filter(
    (m: { user_id: string }) => !members.some((gm: { user_id?: string; id?: string }) => {
      const gmId = gm.user_id || gm.id; // defensive
      return gmId === m.user_id;
    })
  );

  // Get available permission sets (not already assigned)
  // groupPermissionSets are now full objects, so we compare IDs directly
  const availablePermissionSets = (allPermissionSets || []).filter(
    (ps) => !groupPermissionSets.some((gps: { id: string }) => gps.id === ps.id)
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg p-0 overflow-y-auto">
          <VisuallyHidden>
            <SheetTitle>Group Details</SheetTitle>
          </VisuallyHidden>

          {groupLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
              <div className="space-y-2 mt-8">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ) : groupError ? (
            <ErrorDisplay
              error={groupErrorDetails}
              onClose={() => onOpenChange(false)}
              onRetry={() => mutateGroup()}
            />
          ) : group ? (
            <div className="flex flex-col h-full">
              <GroupHeader
                group={group}
                isEditing={isEditing}
                editForm={editForm}
                isUpdating={isUpdating}
                onStartEdit={handleStartEdit}
                onCancelEdit={() => setIsEditing(false)}
                onSave={handleSaveChanges}
                onEditFormChange={setEditForm}
              />

              {/* Stats */}
              <div className="px-6 py-4 grid grid-cols-4 gap-4 border-b">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Members</span>
                  </div>
                  <p className="text-lg font-semibold">{group.member_count ?? members?.length ?? 0}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs">Permissions</span>
                  </div>
                  <p className="text-lg font-semibold">{group.permission_set_count ?? groupPermissionSets?.length ?? 0}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Box className="h-4 w-4" />
                    <span className="text-xs">Assets</span>
                  </div>
                  <p className="text-lg font-semibold">{assets?.length ?? 0}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Created</span>
                  </div>
                  <p className="text-sm font-semibold">{formatDate(group.created_at)}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex-1 px-6 py-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
                    <TabsTrigger value="permissions" className="flex-1">Permissions</TabsTrigger>
                    <TabsTrigger value="assets" className="flex-1">Assets</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <OverviewTab group={group} />
                  </TabsContent>

                  <TabsContent value="members">
                    <MembersTab
                      members={members}
                      isLoading={membersLoading}
                      onAddMember={() => setAddMemberDialogOpen(true)}
                      onRemoveMember={(userId, name) => setMemberToRemove({ userId, name })}
                    />
                  </TabsContent>

                  <TabsContent value="permissions">
                    <PermissionsTab
                      permissionSets={groupPermissionSets}
                      isLoading={permissionsLoading}
                      onAddPermissionSet={() => setAddPermissionDialogOpen(true)}
                      onRemovePermissionSet={(id, name) => setPermissionToRemove({ id, name })}
                    />
                  </TabsContent>

                  <TabsContent value="assets">
                    <AssetsTab
                      assets={assets}
                      isLoading={assetsLoading}
                      onAddAsset={() => setAddAssetDialogOpen(true)}
                      onRemoveAsset={(id, name) => setAssetToRemove({ id, name })}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            <ErrorDisplay
              error={{ status: 404 }}
              onClose={() => onOpenChange(false)}
              onRetry={() => mutateGroup()}
            />
          )}
        </SheetContent>
      </Sheet>

      <AddMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        newMember={newMember}
        setNewMember={setNewMember}
        isAddingMember={isAddingMember}
        onAddMember={handleAddMember}
        availableMembers={availableMembers}
      />

      <AddPermissionSetDialog
        open={addPermissionDialogOpen}
        onOpenChange={setAddPermissionDialogOpen}
        newPermissionSetId={newPermissionSetId}
        setNewPermissionSetId={setNewPermissionSetId}
        isAssigning={isAssigning}
        onAssign={handleAssignPermissionSet}
        availablePermissionSets={availablePermissionSets}
      />

      <AddAssetDialog
        open={addAssetDialogOpen}
        onOpenChange={setAddAssetDialogOpen}
        isAssigning={isAssigningAsset}
        onAssign={handleAssignAsset}
        existingAssets={assets}
      />

      {/* Remove Member Confirmation */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{memberToRemove?.name}&quot; from this group?
              They will lose all group-based permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={isRemovingMember}>
              {isRemovingMember ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Permission Set Confirmation */}
      <Dialog open={!!permissionToRemove} onOpenChange={(open) => !open && setPermissionToRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Remove Permission Set</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the &quot;{permissionToRemove?.name}&quot; permission set from this group?
              All members will lose these permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPermissionToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnassignPermissionSet} disabled={isUnassigning}>
              {isUnassigning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Asset Confirmation */}
      <Dialog open={!!assetToRemove} onOpenChange={(open) => !open && setAssetToRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Remove Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the asset &quot;{assetToRemove?.name}&quot; from this group?
              The group will lose access to this asset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssetToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnassignAsset} disabled={isUnassigningAsset}>
              {isUnassigningAsset ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
