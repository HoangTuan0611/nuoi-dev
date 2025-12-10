'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { Profile } from '@/types/profile';
import { getLevelTitle, calculateLevelProgress, formatDate, getRankInfo } from '@/lib/utils';
import { useVisitor } from '@/hooks/useVisitor';
import { useAuth } from '@/context/AuthContext';

interface ProfilePageProps {
    params: Promise<{ id: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [voteMessage, setVoteMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { vote, remainingVotes } = useVisitor();

    const isOwner = user && profile?.userId === user.id;

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

    const handleVote = async () => {
        const result = await vote(id);
        if (result.success) {
            setVoteMessage('Ủng hộ thành công!');
            fetchProfile();
        } else {
            setVoteMessage(result.error || 'Thất bại');
        }
        setTimeout(() => setVoteMessage(''), 3000);
    };

    const handleDelete = async () => {
        if (!confirm('Chắc chắn xoá hồ sơ này?')) return;

        try {
            const res = await fetch(`/api/profiles/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                router.push('/');
            } else {
                const data = await res.json();
                alert(data.error || 'Không thể xoá');
            }
        } catch (err) {
            console.error('Error deleting profile:', err);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải hồ sơ...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className={styles.errorContainer}>
                <h2>{error || 'Không tìm thấy'}</h2>
                <Link href="/" className={styles.backButton}>
                    Về Trang Chủ
                </Link>
            </div>
        );
    }

    const levelProgress = calculateLevelProgress(profile.xp, profile.level);
    const rankInfo = getRankInfo(profile.rank);

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backLink}>
                Quay lại
            </Link>

            <div className={styles.profileCard}>
                <div className={styles.header}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            <img
                                src={profile.avatar}
                                alt={profile.name}
                                className={styles.avatar}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${profile.name}`;
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.mainInfo}>
                        <h1 className={styles.name}>{profile.name}</h1>
                        {profile.nickname && (
                            <p className={styles.nickname}>@{profile.nickname}</p>
                        )}
                        {profile.catchphrase && (
                            <p className={styles.catchphrase}>"{profile.catchphrase}"</p>
                        )}

                        <div className={styles.rankSection}>
                            <div
                                className={styles.rankBadge}
                                style={{ background: `${rankInfo.color}20`, borderColor: rankInfo.color }}
                            >
                                <span style={{ color: rankInfo.color }}>{rankInfo.name}</span>
                            </div>
                            <div className={styles.voteCount}>
                                <span className={styles.voteNumber}>{profile.votes || 0}</span>
                                <span className={styles.voteLabel}>ủng hộ</span>
                            </div>
                            <div className={styles.moodDisplay}>
                                <span className={styles.moodLabel}>Tâm trạng: {profile.mood}</span>
                            </div>
                        </div>

                        <div className={styles.levelBox}>
                            <div className={styles.levelInfo}>
                                <span className={styles.levelNumber}>Lv.{profile.level}</span>
                                <span className={styles.levelTitle}>{getLevelTitle(profile.level)}</span>
                            </div>
                            <div className={styles.xpBar}>
                                <div
                                    className={styles.xpProgress}
                                    style={{ width: `${levelProgress}%` }}
                                ></div>
                            </div>
                            <p className={styles.xpText}>{profile.xp} XP</p>
                        </div>
                    </div>
                </div>

                <div className={styles.voteSection}>
                    <button
                        className={styles.voteBtn}
                        onClick={handleVote}
                        disabled={remainingVotes <= 0}
                    >
                        Ủng Hộ +1
                    </button>
                    <span className={styles.remainingVotes}>
                        Còn {remainingVotes} lượt hôm nay
                    </span>
                    {voteMessage && (
                        <span className={`${styles.voteMessage} ${voteMessage.includes('thành công') ? styles.success : styles.error}`}>
                            {voteMessage}
                        </span>
                    )}
                </div>

                {isOwner && (
                    <div className={styles.actions}>
                        <Link href={`/profile/${id}/edit`} className={styles.editButton}>
                            Chỉnh sửa hồ sơ
                        </Link>
                        <button onClick={handleDelete} className={styles.deleteButton}>
                            Xoá hồ sơ
                        </button>
                    </div>
                )}

                <div className={styles.content}>
                    {/* Gallery Section */}
                    {profile.galleryImages && profile.galleryImages.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Ảnh giới thiệu</h2>
                            <div className={styles.galleryGrid}>
                                {profile.galleryImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className={styles.galleryItem}
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <img src={img} alt={`Gallery ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Giới thiệu</h2>
                        <p className={styles.bio}>{profile.bio}</p>
                    </section>

                    {profile.skills && profile.skills.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Skills</h2>
                            <div className={styles.tags}>
                                {profile.skills.map((skill, index) => (
                                    <span key={index} className={styles.tag}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {profile.funFacts && profile.funFacts.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Fun Facts</h2>
                            <ul className={styles.funFactsList}>
                                {profile.funFacts.map((fact, index) => (
                                    <li key={index}>{fact}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {profile.achievements && profile.achievements.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Thành tựu</h2>
                            <div className={styles.achievements}>
                                {profile.achievements.map((achievement) => (
                                    <div key={achievement.id} className={styles.achievement}>
                                        <div className={styles.achievementInfo}>
                                            <h4>{achievement.title}</h4>
                                            <p>{achievement.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Thông tin</h2>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Tham gia:</span>
                                <span className={styles.infoValue}>{formatDate(profile.createdAt)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Cập nhật:</span>
                                <span className={styles.infoValue}>{formatDate(profile.updatedAt)}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div className={styles.imageModal} onClick={() => setSelectedImage(null)}>
                    <div className={styles.imageModalContent}>
                        <img src={selectedImage} alt="Full size" />
                        <button className={styles.closeModal} onClick={() => setSelectedImage(null)}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
