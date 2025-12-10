'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import ProfileForm from '@/components/ProfileForm';
import { Profile, UpdateProfileDTO } from '@/types/profile';

interface EditProfilePageProps {
    params: Promise<{ id: string }>;
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/profiles/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else {
                setError('Không tìm thấy hồ sơ');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: UpdateProfileDTO) => {
        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch(`/api/profiles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                router.push(`/profile/${id}`);
            } else {
                const err = await res.json();
                setError(err.error || 'Có lỗi xảy ra');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Không thể cập nhật hồ sơ. Vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorEmoji}>😵</div>
                <h2>{error || 'Không tìm thấy hồ sơ'}</h2>
                <Link href="/" className={styles.backButton}>
                    Về Trang Chủ
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Link href={`/profile/${id}`} className={styles.backLink}>
                ← Quay lại hồ sơ
            </Link>

            <div className={styles.header}>
                <h1 className={styles.title}>Chỉnh sửa: {profile.name}</h1>
                <p className={styles.subtitle}>
                    Bạn có thể chỉnh sửa bất cứ điều gì bạn muốn! 🎨
                </p>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.formWrapper}>
                <ProfileForm
                    profile={profile}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                />
            </div>
        </div>
    );
}
