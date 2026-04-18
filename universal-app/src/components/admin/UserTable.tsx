'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus,
  ChevronUp,
  ChevronDown,
  Mail,
  Shield,
  Eye
} from 'lucide-react';
import { AdminUser } from '@/types/admin';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/dates';

type SortField = 'name' | 'email' | 'role' | 'status' | 'lastLogin';
type SortDirection = 'asc' | 'desc';

interface UserTableProps {
  users: AdminUser[];
  onEdit: (user: AdminUser) => void;
  onDelete: (userId: string) => void;
  onBulkDelete?: (userIds: string[]) => void;
  onAdd: () => void;
  canEdit: boolean;
}

const STATUS_COLORS: Record<AdminUser['status'], string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-warning/10 text-warning border-warning/20'
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  social_worker: 'Social Worker',
  housing_officer: 'Housing Officer'
};

export function UserTable({ users, onEdit, onDelete, onBulkDelete, onAdd, canEdit }: UserTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = search === '' || 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.team.toLowerCase().includes(search.toLowerCase());
        
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'email':
            comparison = a.email.localeCompare(b.email);
            break;
          case 'role':
            comparison = a.role.localeCompare(b.role);
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
          case 'lastLogin':
            comparison = (a.lastLogin || '').localeCompare(b.lastLogin || '');
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [users, search, roleFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4" /> 
      : <ChevronDown className="w-4 h-4" />;
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedUsers);
    if (onBulkDelete) {
      onBulkDelete(ids);
    } else {
      ids.forEach((id) => onDelete(id));
    }
    setSelectedUsers(new Set());
    setShowBulkDeleteDialog(false);
  };

  return (
    <Card variant="glass" hoverEffect={false} className="bg-card/80 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="social_worker">Social Worker</SelectItem>
                <SelectItem value="housing_officer">Housing Officer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add button or View Only badge */}
          {canEdit ? (
            <Button onClick={onAdd} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          ) : (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-muted-foreground border-border">
              <Eye className="w-3.5 h-3.5" />
              View only
            </Badge>
          )}
        </div>

        {/* Bulk actions — only shown when canEdit and items are selected */}
        {canEdit && selectedUsers.size > 0 && (
          <div className="flex items-center gap-4 py-2 px-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.size} selected
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(new Set())}>
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {canEdit && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-input"
                    aria-label="Select all users"
                  />
                </th>
              )}
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  User <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-1">
                  Role <SortIcon field="role" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status <SortIcon field="status" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort('lastLogin')}
              >
                <div className="flex items-center gap-1">
                  Last Login <SortIcon field="lastLogin" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className={cn(
                  'hover:bg-muted/50 transition-colors',
                  selectedUsers.has(user.id) && 'bg-info/10'
                )}
              >
                {canEdit && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="rounded border-input"
                      aria-label={`Select ${user.name}`}
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-semibold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.team}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge 
                    variant="outline" 
                    className={cn('capitalize', STATUS_COLORS[user.status])}
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {user.lastLogin 
                    ? formatDistanceToNow(new Date(user.lastLogin))
                    : 'Never'
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      aria-label="Send email to user"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {canEdit && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => onEdit(user)}
                          aria-label="Edit user"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                            aria-label="More options"
                            aria-expanded={activeMenu === user.id}
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          {activeMenu === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                              <button 
                                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                                onClick={() => {
                                  onEdit(user);
                                  setActiveMenu(null);
                                }}
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button 
                                className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                                onClick={() => {
                                  if (confirm(`Delete ${user.name}?`)) {
                                    onDelete(user.id);
                                  }
                                  setActiveMenu(null);
                                }}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-muted/50 text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title={`Delete ${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''}?`}
        description="This action cannot be undone. The selected user accounts will be permanently removed."
        confirmText={`Delete ${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''}`}
        destructive
        onConfirm={handleBulkDelete}
      />
    </Card>
  );
}
