'use client';

import React from 'react';
import { AdminPageWrapper } from '@/components/admin/AdminHeader';
import { AuditLog } from '@/components/admin/AuditLog';
import { useAdmin } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/badge';

export default function AuditPage() {
  const { auditLog, canViewAudit, tenantConfig } = useAdmin();

  if (!canViewAudit) {
    return (
      <AdminPageWrapper 
        title="Audit Log" 
        description="Access denied"
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground">You do not have permission to view the audit log.</p>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper 
      title="Audit Log" 
      description={`Track admin actions and system events for ${tenantConfig.name}`}
      action={
        <Badge variant="secondary">
          {auditLog.length} entries
        </Badge>
      }
    >
      <AuditLog entries={auditLog} pageSize={15} />
    </AdminPageWrapper>
  );
}
