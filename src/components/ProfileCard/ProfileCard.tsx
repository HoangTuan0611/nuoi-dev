'use client';

import { useState } from 'react';
import styles from './ProfileCard.module.css';
import { Profile } from '@/types/profile';
import { getRankInfo } from '@/lib/utils';
import Link from 'next/link';
import { useVisitor } from '@/hooks/useVisitor';
import { useAuth } from '@/context/AuthContext';

interface ProfileCardProps {
    profile: Profile;
    onDelete?: (id: string) => void;
    showVote?: boolean;
    rank?: number;
}

export default function ProfileCard({ profile, onDelete, showVote = true, rank }: ProfileCardProps) {
    const { user } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [voting, setVoting] = useState(false);
    const [voteMessage, setVoteMessage] = useState('');
    const [localVotes, setLocalVotes] = useState(profile.votes);
    const { vote, remainingVotes } = useVisitor();

    const rankInfo = getRankInfo(profile.rank);
    const isOwner = user && profile.userId === user.id;

    const handleVote = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (voting) return;
        setVoting(true);
        setVoteMessage('');

        const result = await vote(profile.id);

        if (result.success) {
            setLocalVotes(prev => prev + 1);
            setVoteMessage('Thành công!');
        } else {
            setVoteMessage(result.error || 'Thất bại');
        }

        setTimeout(() => setVoteMessage(''), 3000);
        setVoting(false);
    };

    return (
        <div
            className={styles.card}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {rank && (
                <div className={styles.rankBadge} data-rank={rank <= 3 ? rank : 'other'}>
                    #{rank}
                </div>
            )}

            <div className={styles.cardInner}>
                <div className={styles.avatarContainer}>
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

                <div className={styles.info}>
                    <h3 className={styles.name}>{profile.name}</h3>
                    {profile.nickname && (
                        <p className={styles.nickname}>@{profile.nickname}</p>
                    )}

                    <div className={styles.rankTag} style={{ background: `${rankInfo.color}20`, color: rankInfo.color }}>
                        {rankInfo.name}
                    </div>

                    <div className={styles.stats}>
                        <span className={styles.votes}>{localVotes} ủng hộ</span>
                        <span className={styles.level}>Lv.{profile.level}</span>
                    </div>
                </div>

                {showVote && (
                    <div className={styles.voteSection}>
                        <button
                            className={styles.voteBtn}
                            onClick={handleVote}
                            disabled={voting || remainingVotes <= 0}
                        >
                            {voting ? 'Đang...' : 'Ủng Hộ +1'}
                        </button>
                        {voteMessage && (
                            <p className={`${styles.voteMessage} ${voteMessage.includes('Thành công') ? styles.success : styles.error}`}>
                                {voteMessage}
                            </p>
                        )}
                    </div>
                )}

                <div className={`${styles.actions} ${isHovered ? styles.visible : ''}`}>
                    <Link href={`/profile/${profile.id}`} className={styles.viewBtn}>
                        Xem Chi Tiết
                    </Link>
                    {isOwner && (
                        <>
                            <Link href={`/profile/${profile.id}/edit`} className={styles.editBtn}>
                                Sửa
                            </Link>
                            {onDelete && (
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (confirm('Chắc chắn xoá hồ sơ này?')) {
                                            onDelete(profile.id);
                                        }
                                    }}
                                >
                                    Xoá
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
