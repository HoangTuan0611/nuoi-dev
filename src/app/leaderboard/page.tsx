'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { Profile } from '@/types/profile';
import { getRankInfo } from '@/lib/utils';
import { useVisitor } from '@/hooks/useVisitor';

export default function LeaderboardPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const { vote, remainingVotes } = useVisitor();

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                const data = await res.json();
                setProfiles(data);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation();
        const result = await vote(profileId);
        if (result.success) {
            fetchLeaderboard();
            if (selectedProfile?.id === profileId) {
                setSelectedProfile(prev => prev ? { ...prev, votes: (prev.votes || 0) + 1 } : null);
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Bảng Xếp Hạng</h1>
                <p className={styles.subtitle}>Top các dev được ủng hộ nhiều nhất</p>
                <div className={styles.voteInfo}>
                    Bạn còn <strong>{remainingVotes}</strong> lượt ủng hộ hôm nay
                </div>
            </div>

            <div className={styles.content}>
                {/* Leaderboard List */}
                <div className={styles.leaderboardSection}>
                    {loading ? (
                        <div className={styles.loading}><div className={styles.spinner}></div></div>
                    ) : profiles.length > 0 ? (
                        <div className={styles.leaderboard}>
                            {profiles.map((profile, index) => {
                                const rankInfo = getRankInfo(profile.rank);
                                const position = index + 1;
                                const isSelected = selectedProfile?.id === profile.id;

                                return (
                                    <div
                                        key={profile.id}
                                        className={`${styles.row} ${position <= 3 ? styles[`top${position}`] : ''} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => setSelectedProfile(profile)}
                                    >
                                        <div className={styles.position}>#{position}</div>

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

                                        <div className={styles.info}>
                                            <span className={styles.name}>{profile.name}</span>
                                            {profile.nickname && (
                                                <span className={styles.nickname}>@{profile.nickname}</span>
                                            )}
                                            <div
                                                className={styles.rankBadge}
                                                style={{ background: `${rankInfo.color}20`, color: rankInfo.color }}
                                            >
                                                {rankInfo.name}
                                            </div>
                                        </div>

                                        <div className={styles.stats}>
                                            <span className={styles.votes}>{profile.votes || 0}</span>
                                            <span className={styles.votesLabel}>ủng hộ</span>
                                        </div>

                                        <button
                                            className={styles.voteBtn}
                                            onClick={(e) => handleVote(e, profile.id)}
                                            disabled={remainingVotes <= 0}
                                        >
                                            +1
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <p>Chưa có hồ sơ nào</p>
                            <Link href="/create" className={styles.createBtn}>Tạo hồ sơ đầu tiên</Link>
                        </div>
                    )}
                </div>

                {/* Profile Preview Panel */}
                <div className={`${styles.previewPanel} ${selectedProfile ? styles.visible : ''}`}>
                    {selectedProfile && (
                        <>
                            <button className={styles.closePreview} onClick={() => setSelectedProfile(null)}>X</button>

                            <div className={styles.previewHeader}>
                                <div className={styles.previewAvatarWrapper}>
                                    <img
                                        src={selectedProfile.avatar}
                                        alt={selectedProfile.name}
                                        className={styles.previewAvatar}
                                    />
                                </div>
                                <h2 className={styles.previewName}>{selectedProfile.name}</h2>
                                {selectedProfile.nickname && (
                                    <p className={styles.previewNickname}>@{selectedProfile.nickname}</p>
                                )}

                                <div
                                    className={styles.previewRank}
                                    style={{
                                        background: `${getRankInfo(selectedProfile.rank).color}20`,
                                        color: getRankInfo(selectedProfile.rank).color
                                    }}
                                >
                                    {getRankInfo(selectedProfile.rank).name}
                                </div>

                                <div className={styles.previewVotes}>
                                    <span className={styles.previewVoteNumber}>{selectedProfile.votes || 0}</span>
                                    <span>ủng hộ</span>
                                </div>
                            </div>

                            {selectedProfile.catchphrase && (
                                <p className={styles.previewCatchphrase}>"{selectedProfile.catchphrase}"</p>
                            )}

                            <div className={styles.previewBio}>
                                <h3>Giới thiệu</h3>
                                <p>{selectedProfile.bio}</p>
                            </div>

                            {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                                <div className={styles.previewSkills}>
                                    <h3>Skills</h3>
                                    <div className={styles.skillTags}>
                                        {selectedProfile.skills.map((skill, i) => (
                                            <span key={i} className={styles.skillTag}>{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedProfile.galleryImages && selectedProfile.galleryImages.length > 0 && (
                                <div className={styles.previewGallery}>
                                    <h3>Ảnh</h3>
                                    <div className={styles.galleryGrid}>
                                        {selectedProfile.galleryImages.map((img, i) => (
                                            <img key={i} src={img} alt="" className={styles.galleryImg} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.previewActions}>
                                <button
                                    className={styles.previewVoteBtn}
                                    onClick={(e) => handleVote(e, selectedProfile.id)}
                                    disabled={remainingVotes <= 0}
                                >
                                    Ủng hộ +1
                                </button>
                                <Link href={`/profile/${selectedProfile.id}`} className={styles.viewDetailBtn}>
                                    Xem đầy đủ
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
