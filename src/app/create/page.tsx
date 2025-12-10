'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import ProfileForm from '@/components/ProfileForm';
import { CreateProfileDTO, UpdateProfileDTO } from '@/types/profile';

export default function CreateProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (data: CreateProfileDTO | UpdateProfileDTO) => {
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/profiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const profile = await res.json();
                router.push(`/profile/${profile.id}`);
            } else {
                const err = await res.json();
                setError(err.error || 'Có lỗi xảy ra');
            }
        } catch (err) {
            console.error('Error creating profile:', err);
            setError('Không thể tạo hồ sơ. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Tạo Hồ Sơ Mới</h1>
                <p className={styles.subtitle}>
                    Thêm mình hoặc &quot;tag&quot; đồng nghiệp vào Nuôi DEV! 🎭
                </p>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.formWrapper}>
                <ProfileForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
        </div>
    );
}
