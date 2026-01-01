'use client';

import React, { useState, useEffect } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import styles from './layout.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [organizationName, setOrganizationName] = useState('Loading...');

    useEffect(() => {
        // Fetch organization info
        const fetchOrg = async () => {
            try {
                const res = await fetch('/api/settings/organization');
                if (res.ok) {
                    const data = await res.json();
                    if (data.name) {
                        setOrganizationName(data.name);
                    } else {
                        setOrganizationName('My Organization');
                    }
                } else {
                    setOrganizationName('My Organization');
                }
            } catch (error) {
                console.error('Failed to fetch organization:', error);
                setOrganizationName('My Organization');
            }
        };

        fetchOrg();
    }, []);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const toggleMobileMenu = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <LanguageProvider>
            <div className={styles.layout}>
                {/* Animated Background */}
                <div className="bg-mesh" />

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
                )}

                {/* Sidebar */}
                <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.open : ''}`}>
                    <Sidebar
                        isCollapsed={sidebarCollapsed}
                        onToggle={toggleSidebar}
                        organizationName={organizationName}
                    />
                </div>

                {/* Topbar */}
                <div
                    className={styles.topbarWrapper}
                    style={{
                        '--sidebar-offset': sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'
                    } as React.CSSProperties}
                >
                    <Topbar onMenuToggle={toggleMobileMenu} />
                </div>

                {/* Main Content */}
                <main
                    className={styles.main}
                    style={{
                        '--sidebar-offset': sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'
                    } as React.CSSProperties}
                >
                    <div className={styles.content}>
                        {children}
                    </div>
                </main>
            </div>
        </LanguageProvider>
    );
}
