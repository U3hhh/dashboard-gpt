'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from '../subscriptions/page.module.css';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'head_of_project' | 'member';
    is_active: boolean;
    created_at: string;
}

const mockUsers: User[] = [
    { id: '1', name: 'أحمد المدير', email: 'admin@example.com', role: 'admin', is_active: true, created_at: '2024-01-01' },
    { id: '2', name: 'سارة رئيسة المشروع', email: 'sarah@example.com', role: 'head_of_project', is_active: true, created_at: '2024-02-15' },
    { id: '3', name: 'محمد عضو', email: 'mohammed@example.com', role: 'member', is_active: true, created_at: '2024-03-20' },
    { id: '4', name: 'فاطمة عضو', email: 'fatima@example.com', role: 'member', is_active: false, created_at: '2024-04-10' },
];

export default function UsersPage() {
    const { language } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'member' as 'admin' | 'head_of_project' | 'member',
        password: '',
    });

    useEffect(() => {
        // Simulate loading users (in real app, fetch from API)
        setTimeout(() => {
            setUsers(mockUsers);
            setLoading(false);
        }, 500);
    }, []);

    const t = {
        title: language === 'ar' ? 'إدارة المستخدمين' : 'User Management',
        subtitle: language === 'ar' ? 'إضافة وإدارة مستخدمي لوحة التحكم' : 'Add and manage dashboard users',
        addUser: language === 'ar' ? 'إضافة مستخدم' : 'Add User',
        name: language === 'ar' ? 'الاسم' : 'Name',
        email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
        role: language === 'ar' ? 'الدور' : 'Role',
        status: language === 'ar' ? 'الحالة' : 'Status',
        actions: language === 'ar' ? 'الإجراءات' : 'Actions',
        admin: language === 'ar' ? 'مدير' : 'Admin',
        headOfProject: language === 'ar' ? 'رئيس المشروع' : 'Head of Project',
        member: language === 'ar' ? 'عضو' : 'Member',
        active: language === 'ar' ? 'نشط' : 'Active',
        inactive: language === 'ar' ? 'غير نشط' : 'Inactive',
        edit: language === 'ar' ? 'تعديل' : 'Edit',
        deactivate: language === 'ar' ? 'تعطيل' : 'Deactivate',
        activate: language === 'ar' ? 'تفعيل' : 'Activate',
        save: language === 'ar' ? 'حفظ' : 'Save',
        cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
        password: language === 'ar' ? 'كلمة المرور' : 'Password',
        newUser: language === 'ar' ? 'مستخدم جديد' : 'New User',
        editUser: language === 'ar' ? 'تعديل المستخدم' : 'Edit User',
        createdAt: language === 'ar' ? 'تاريخ الإنشاء' : 'Created',
    };

    const roleLabels = {
        admin: t.admin,
        head_of_project: t.headOfProject,
        member: t.member,
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', role: 'member', password: '' });
        setShowModal(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
        setShowModal(true);
    };

    const handleToggleStatus = (user: User) => {
        setUsers(users.map(u =>
            u.id === user.id ? { ...u, is_active: !u.is_active } : u
        ));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            // Update existing user
            setUsers(users.map(u =>
                u.id === editingUser.id
                    ? { ...u, name: formData.name, email: formData.email, role: formData.role }
                    : u
            ));
        } else {
            // Add new user
            const newUser: User = {
                id: Date.now().toString(),
                name: formData.name,
                email: formData.email,
                role: formData.role,
                is_active: true,
                created_at: new Date().toISOString().split('T')[0],
            };
            setUsers([...users, newUser]);
        }
        setShowModal(false);
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t.title}</h1>
                    <p className={styles.subtitle}>{t.subtitle}</p>
                </div>
                <button className={styles.addBtn} onClick={handleAddUser}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    {t.addUser}
                </button>
            </div>

            {/* Users Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t.name}</th>
                            <th>{t.email}</th>
                            <th>{t.role}</th>
                            <th>{t.status}</th>
                            <th>{t.createdAt}</th>
                            <th>{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td style={{ fontWeight: 600 }}>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`${styles.badge} ${user.role === 'admin' ? styles.badgeWarning :
                                            user.role === 'head_of_project' ? styles.badgeSuccess :
                                                styles.badgeMuted
                                        }`}>
                                        {roleLabels[user.role]}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${user.is_active ? styles.badgeSuccess : styles.badgeMuted}`}>
                                        {user.is_active ? t.active : t.inactive}
                                    </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleEditUser(user)}
                                        >
                                            {t.edit}
                                        </button>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleToggleStatus(user)}
                                            style={{ color: user.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}
                                        >
                                            {user.is_active ? t.deactivate : t.activate}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>
                            {editingUser ? t.editUser : t.newUser}
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
                                <label>{t.email} *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            {!editingUser && (
                                <div className={styles.modalField}>
                                    <label>{t.password} *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                    />
                                </div>
                            )}
                            <div className={styles.modalField}>
                                <label>{t.role}</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof formData.role })}
                                >
                                    <option value="member">{t.member}</option>
                                    <option value="head_of_project">{t.headOfProject}</option>
                                    <option value="admin">{t.admin}</option>
                                </select>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className={styles.saveBtn}>
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
