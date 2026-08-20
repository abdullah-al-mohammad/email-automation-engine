import { useState } from 'react';

export type EditingField = 'email' | 'subscribed' | null;

export function useContactEditor() {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editSubscribed, setEditSubscribed] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const startEditEmail = (value: string) => {
    setEditEmail(value);
    setEditingField('email');
  };

  const startEditSubscribed = (value: boolean) => {
    setEditSubscribed(value);
    setEditingField('subscribed');
  };

  const finishEdit = () => setEditingField(null);

  const toggleDeleteConfirm = () => setShowDeleteConfirm((prev) => !prev);

  return {
    editingField,
    editEmail,
    editSubscribed,
    showDeleteConfirm,
    startEditEmail,
    startEditSubscribed,
    setEditEmail,
    setEditSubscribed,
    finishEdit,
    toggleDeleteConfirm,
  };
}
