import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type EmailTemplateResponse } from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

import EmailTemplateHeader from '../../components/email-templates/EmailTemplateHeader';
import EmailTemplateList from '../../components/email-templates/EmailTemplateList';
import Confirm from '../../components/modals/Confirm';
import EmptyState from '../../components/shared/EmptyState';
import { Mail } from 'lucide-react';

export default function EmailTemplates() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<EmailTemplateResponse[]>(
        `/tenants/${currentTenant?.id}/email-templates`,
      );
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/email-templates/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['email-templates', currentTenant?.id] });
      setTemplateToDelete(null);
    },
  });

  return (
    <div className="py-6 space-y-6">
      <EmailTemplateHeader />

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading templates...</div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<Mail className="w-6 h-6 text-gray-400" />}
          title="No templates found"
          description="Create your first email template to use in workflows."
        />
      ) : (
        <EmailTemplateList templates={templates} onDelete={(id) => setTemplateToDelete(id)} />
      )}

      <Confirm
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() => templateToDelete && deleteMutation.mutate(templateToDelete)}
        title="Delete template"
        description="Are you sure you want to delete this template? This action cannot be undone."
      />
    </div>
  );
}
