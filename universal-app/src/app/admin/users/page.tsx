'use client';

import React, { useState } from 'react';
import { AdminPageWrapper } from '@/components/admin/AdminHeader';
import { UserTable } from '@/components/admin/UserTable';
import { UserForm } from '@/components/admin/UserForm';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/components/Toast';
import { AdminUser } from '@/types/admin';

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser, canManageUsers, tenantConfig } = useAdmin();
  const { success, error } = useToast();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (userId: string) => {
    try {
      deleteUser(userId);
      success('User deleted successfully');
    } catch (err) {
      error('Failed to delete user');
    }
  };

  const handleSave = async (data: Omit<AdminUser, 'id' | 'createdAt'>) => {
    setIsSubmitting(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (editingUser) {
        updateUser(editingUser.id, data);
        success('User updated successfully');
      } else {
        addUser(data);
        success('User created successfully');
      }
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (err) {
      error('Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  return (
    <AdminPageWrapper 
      title="User Management" 
      description={`Manage users and roles for ${tenantConfig.name}`}
    >
      <div className="space-y-6">
        <UserTable 
          users={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          canEdit={canManageUsers}
        />
      </div>

      {isFormOpen && (
        <UserForm
          user={editingUser}
          onSave={handleSave}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </AdminPageWrapper>
  );
}
