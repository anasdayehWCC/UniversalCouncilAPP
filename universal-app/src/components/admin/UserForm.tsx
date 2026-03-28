'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { AdminUser } from '@/types/admin';
import { ServiceDomain, UserRole } from '@/config/domains';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// Zod schema for validation
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'social_worker', 'housing_officer']),
  domain: z.enum(['children', 'adults', 'housing', 'corporate']),
  team: z.string().min(2, 'Team name must be at least 2 characters'),
  status: z.enum(['active', 'inactive', 'pending'])
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: AdminUser | null;
  onSave: (data: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'social_worker', label: 'Social Worker' },
  { value: 'housing_officer', label: 'Housing Officer' }
];

const DOMAIN_OPTIONS = [
  { value: 'children', label: "Children's Social Care" },
  { value: 'adults', label: 'Adult Social Care' },
  { value: 'housing', label: 'Housing Services' },
  { value: 'corporate', label: 'Corporate Services' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' }
];

const TEAM_SUGGESTIONS: Record<string, string[]> = {
  children: ['Family Intervention', 'Child Protection', 'Fostering & Adoption', 'Early Help'],
  adults: ['Adult Services Management', 'Mental Health', 'Learning Disabilities', 'Older People'],
  housing: ['Housing Support', 'Repairs & Maintenance', 'Lettings', 'Community Safety'],
  corporate: ['Digital Transformation', 'Finance', 'HR', 'Legal']
};

export function UserForm({ user, onSave, onCancel, isSubmitting = false }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: (user?.role as UserRole) || 'social_worker',
    domain: (user?.domain as ServiceDomain) || 'children',
    team: user?.team || '',
    status: user?.status || 'pending'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate field on blur
  const validateField = (field: keyof UserFormData) => {
    try {
      const fieldSchema = userSchema.shape[field];
      fieldSchema.parse(formData[field]);
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: err.errors[0].message }));
      }
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    try {
      userSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
        // Mark all fields as touched
        setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      name: formData.name,
      email: formData.email,
      role: formData.role as UserRole,
      domain: formData.domain as ServiceDomain,
      team: formData.team,
      status: formData.status
    });
  };

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field);
    }
  };

  const handleBlur = (field: keyof UserFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const teamSuggestions = TEAM_SUGGESTIONS[formData.domain] || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card variant="glass" className="w-full max-w-lg bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-display font-bold text-slate-900">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className={cn(errors.name && touched.name && 'text-red-600')}>
              Full Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Enter full name"
              className={cn(errors.name && touched.name && 'border-red-300 focus-visible:ring-red-500')}
            />
            {errors.name && touched.name && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className={cn(errors.email && touched.email && 'text-red-600')}>
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="user@council.gov.uk"
              className={cn(errors.email && touched.email && 'border-red-300 focus-visible:ring-red-500')}
            />
            {errors.email && touched.email && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Role and Domain */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => handleChange('role', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Service Area *</Label>
              <Select 
                value={formData.domain} 
                onValueChange={(v) => {
                  handleChange('domain', v);
                  // Reset team when domain changes
                  if (!TEAM_SUGGESTIONS[v]?.includes(formData.team)) {
                    handleChange('team', '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label htmlFor="team" className={cn(errors.team && touched.team && 'text-red-600')}>
              Team *
            </Label>
            <Input
              id="team"
              value={formData.team}
              onChange={(e) => handleChange('team', e.target.value)}
              onBlur={() => handleBlur('team')}
              placeholder="Enter team name"
              list="team-suggestions"
              className={cn(errors.team && touched.team && 'border-red-300 focus-visible:ring-red-500')}
            />
            <datalist id="team-suggestions">
              {teamSuggestions.map(team => (
                <option key={team} value={team} />
              ))}
            </datalist>
            {errors.team && touched.team && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.team}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select 
              value={formData.status} 
              onValueChange={(v) => handleChange('status', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                user ? 'Save Changes' : 'Add User'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
