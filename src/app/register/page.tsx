'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const { register, user } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Redirect if already logged in
    if (user) {
        router.push('/');
        return null;
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
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
            } else {
                setError('Upload ảnh thất bại');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Có lỗi khi upload ảnh');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await register(username, password, displayName, avatar);

        if (result.success) {
            router.push('/create');
        } else {
            setError(result.error || 'Đăng ký thất bại');
        }

        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.title}>Đăng Ký</h1>
                <p className={styles.subtitle}>Tham gia Nuôi DEV ngay!</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarPreview}>
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <span>Ảnh</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className={styles.fileInput}
                        />
                        <button
                            type="button"
                            className={styles.uploadBtn}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? 'Đang tải...' : 'Chọn ảnh đại diện'}
                        </button>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Username *</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            placeholder="username (3-20 ký tự)"
                            required
                            minLength={3}
                            maxLength={20}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Tên hiển thị</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className={styles.input}
                            placeholder="Tên để hiển thị"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password *</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="Mật khẩu (ít nhất 4 ký tự)"
                            required
                            minLength={4}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading || uploading}
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
                    </button>
                </form>

                <p className={styles.switchText}>
                    Đã có tài khoản?{' '}
                    <Link href="/login" className={styles.link}>
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
