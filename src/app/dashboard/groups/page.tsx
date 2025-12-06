'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from './page.module.css';

interface Group {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    member_count?: number;
    created_at: string;
}

export default function GroupsPage() {
    const { language } = useLanguage();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#8b5cf6',
    });
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [availableSubscribers, setAvailableSubscribers] = useState<any[]>([]);
    const [memberLoading, setMemberLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);

    const t = {
        title: language === 'ar' ? 'المجموعات' : 'Groups',
        subtitle: language === 'ar' ? 'إدارة مجموعات المشتركين' : 'Manage subscriber groups',
        addGroup: language === 'ar' ? 'إضافة مجموعة' : 'Add Group',
        name: language === 'ar' ? 'اسم المجموعة' : 'Group Name',
        description: language === 'ar' ? 'الوصف' : 'Description',
        color: language === 'ar' ? 'اللون' : 'Color',
        members: language === 'ar' ? 'الأعضاء' : 'Members',
        actions: language === 'ar' ? 'الإجراءات' : 'Actions',
        edit: language === 'ar' ? 'تعديل' : 'Edit',
        delete: language === 'ar' ? 'حذف' : 'Delete',
        save: language === 'ar' ? 'حفظ' : 'Save',
        cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
        newGroup: language === 'ar' ? 'مجموعة جديدة' : 'New Group',
        editGroup: language === 'ar' ? 'تعديل المجموعة' : 'Edit Group',
        confirmDelete: language === 'ar' ? 'هل أنت متأكد من حذف هذه المجموعة؟' : 'Are you sure you want to delete this group?',
        deleteSuccess: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully',
        manageMembers: language === 'ar' ? 'إدارة الأعضاء' : 'Manage Members',
        addMember: language === 'ar' ? 'إضافة عضو' : 'Add Member',
        searchSubscribers: language === 'ar' ? 'بحث عن مشتركين...' : 'Search subscribers...',
        noMembers: language === 'ar' ? 'لا يوجد أعضاء في هذه المجموعة' : 'No members in this group',
        remove: language === 'ar' ? 'إزالة' : 'Remove',
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch('/api/groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (groupId: string) => {
        setMemberLoading(true);
        try {
            const res = await fetch(`/api/groups/${groupId}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setMemberLoading(false);
        }
    };

    const fetchSubscribers = async () => {
        try {
            const res = await fetch('/api/subscribers?limit=100');
            if (res.ok) {
                const data = await res.json();
                setAvailableSubscribers(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch subscribers:', error);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleAddGroup = () => {
        setEditingGroup(null);
        setFormData({ name: '', description: '', color: '#8b5cf6' });
        setShowModal(true);
    };

    const handleEditGroup = (group: Group) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description || '',
            color: group.color || '#8b5cf6',
        });
        setShowModal(true);
    };

    const handleManageMembers = (group: Group) => {
        setSelectedGroup(group);
        fetchMembers(group.id);
        fetchSubscribers();
        setShowMembersModal(true);
    };

    const handleAddMember = async (subscriberId: string) => {
        if (!selectedGroup) return;
        try {
            const res = await fetch(`/api/groups/${selectedGroup.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriber_id: subscriberId }),
            });

            if (res.ok) {
                fetchMembers(selectedGroup.id);
                fetchGroups(); // Update counts
            } else {
                alert('Failed to add member');
            }
        } catch (error) {
            console.error('Add member error:', error);
        }
    };

    const handleRemoveMember = async (subscriberId: string) => {
        if (!selectedGroup) return;
        try {
            const res = await fetch(`/api/groups/${selectedGroup.id}/members`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriber_id: subscriberId }),
            });

            if (res.ok) {
                fetchMembers(selectedGroup.id);
                fetchGroups(); // Update counts
            } else {
                alert('Failed to remove member');
            }
        } catch (error) {
            console.error('Remove member error:', error);
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm(t.confirmDelete)) return;

        try {
            const res = await fetch(`/api/groups/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setGroups(groups.filter(g => g.id !== id));
            } else {
                alert('Failed to delete group');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
            const method = editingGroup ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchGroups();
                setShowModal(false);
            } else {
                alert('Failed to save group');
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    const filteredSubscribers = availableSubscribers.filter(sub =>
        !members.some(m => m.id === sub.id) &&
        (sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t.title}</h1>
                    <p className={styles.subtitle}>{t.subtitle}</p>
                </div>
                <button className={styles.addBtn} onClick={handleAddGroup}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t.addGroup}
                </button>
            </div>

            <div className={styles.grid}>
                {groups.map((group) => (
                    <div key={group.id} className={styles.card} style={{ borderTop: `4px solid ${group.color || '#ccc'}` }}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{group.name}</h3>
                            <div className={styles.actions}>
                                <button onClick={() => handleManageMembers(group)} className={styles.iconBtn} title={t.manageMembers}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </button>
                                <button onClick={() => handleEditGroup(group)} className={styles.iconBtn} title={t.edit}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button onClick={() => handleDeleteGroup(group.id)} className={`${styles.iconBtn} ${styles.danger}`} title={t.delete}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className={styles.cardDesc}>{group.description || '-'}</p>
                        <div className={styles.cardFooter}>
                            <span className={styles.memberCount}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                {group.member_count} {t.members}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>
                            {editingGroup ? t.editGroup : t.newGroup}
                        </h2>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.modalField}>
                                <label>{t.name} *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{t.description}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{t.color}</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: c })}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: c,
                                                border: formData.color === c ? '2px solid white' : 'none',
                                                outline: formData.color === c ? `2px solid ${c}` : 'none',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className={styles.saveBtn} disabled={saving}>
                                    {saving ? '...' : t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showMembersModal && selectedGroup && (
                <div className={styles.modalOverlay} onClick={() => setShowMembersModal(false)}>
                    <div className={styles.modal} style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>
                            {t.manageMembers}: {selectedGroup.name}
                        </h2>

                        <div style={{ display: 'flex', gap: '1rem', height: '400px' }}>
                            {/* Current Members */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                    {t.members} ({members.length})
                                </h3>
                                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                                    {memberLoading ? (
                                        <div className={styles.loading}><div className={styles.spinner}></div></div>
                                    ) : members.length === 0 ? (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                                            {t.noMembers}
                                        </div>
                                    ) : (
                                        members.map(member => (
                                            <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{member.name}</div>
                                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{member.email}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                                                    title={t.remove}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Add Members */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                    {t.addMember}
                                </h3>
                                <input
                                    type="text"
                                    placeholder={t.searchSubscribers}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                                />
                                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                                    {filteredSubscribers.map(sub => (
                                        <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                                                <div style={{ fontWeight: 500 }}>{sub.name}</div>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{sub.email}</div>
                                            </div>
                                            <button
                                                onClick={() => handleAddMember(sub.id)}
                                                style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button type="button" onClick={() => setShowMembersModal(false)} className={styles.cancelBtn}>
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
