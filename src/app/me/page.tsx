'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function MyAccountPage() {
    const router = useRouter();
    const { user, loading, refreshSession } = useAuth();
    const [editing, setEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (user) {
            setDisplayName(user.displayName);
            setAvatar(user.avatar || '');
            setAvatarPreview(user.avatar || '');
        }
    }, [user, loading, router]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setAvatar(data.url);
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/auth/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName, avatar }),
            });

            if (res.ok) {
                setMessage('Đã lưu thành công!');
                setEditing(false);
                refreshSession();
            } else {
                const data = await res.json();
                setMessage(data.error || 'Lưu thất bại');
            }
        } catch (error) {
            setMessage('Có lỗi xảy ra');
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

    if (!user) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Tài Khoản Của Tôi</h1>
                    <p className={styles.subtitle}>Quản lý thông tin tài khoản</p>
                </div>

                <div className={styles.profileSection}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {editing && (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    accept="image/*"
                                    className={styles.fileInput}
                                />
                                <button
                                    type="button"
                                    className={styles.changeAvatarBtn}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Đang tải...' : 'Đổi ảnh'}
                                </button>
                            </>
                        )}
                    </div>

                    <div className={styles.infoSection}>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Username</span>
                            <span className={styles.value}>@{user.username}</span>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.label}>Tên hiển thị</span>
                            {editing ? (
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className={styles.input}
                                />
                            ) : (
                                <span className={styles.value}>{user.displayName}</span>
                            )}
                        </div>

                        {message && (
                            <div className={`${styles.message} ${message.includes('thành công') ? styles.success : styles.error}`}>
                                {message}
                            </div>
                        )}

                        <div className={styles.actions}>
                            {editing ? (
                                <>
                                    <button
                                        className={styles.saveBtn}
                                        onClick={handleSave}
                                        disabled={saving || uploading}
                                    >
                                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => {
                                            setEditing(false);
                                            setDisplayName(user.displayName);
                                            setAvatar(user.avatar || '');
                                            setAvatarPreview(user.avatar || '');
                                        }}
                                    >
                                        Huỷ
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={styles.editBtn}
                                    onClick={() => setEditing(true)}
                                >
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.profileLinkSection}>
                    <h2 className={styles.sectionTitle}>Hồ Sơ Kêu Gọi Ủng Hộ</h2>
                    {user.profileId ? (
                        <div className={styles.profileLink}>
                            <p>Bạn đã có hồ sơ kêu gọi ủng hộ</p>
                            <Link href={`/profile/${user.profileId}`} className={styles.viewProfileBtn}>
                                Xem hồ sơ
                            </Link>
                            <Link href={`/profile/${user.profileId}/edit`} className={styles.editProfileBtn}>
                                Chỉnh sửa hồ sơ
                            </Link>
                        </div>
                    ) : (
                        <div className={styles.noProfile}>
                            <p>Bạn chưa có hồ sơ kêu gọi ủng hộ</p>
                            <Link href="/create" className={styles.createProfileBtn}>
                                Tạo hồ sơ ngay
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
