// Utility functions

import { Rank } from '@/types/profile';

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày`;
    return formatDate(dateString);
}

export function getMoodEmoji(mood: string): string {
    const moods: Record<string, string> = {
        happy: 'Vui',
        sad: 'Buồn',
        angry: 'Giận',
        sleepy: 'Ngủ',
        coding: 'Code',
        coffee: 'Cafe',
        debugging: 'Debug',
    };
    return moods[mood] || 'Bình thường';
}

export function getLevelTitle(level: number): string {
    if (level >= 50) return 'Huyền Thoại';
    if (level >= 40) return 'Bậc Thầy';
    if (level >= 30) return 'Chuyên Gia';
    if (level >= 20) return 'Thành Thạo';
    if (level >= 10) return 'Lên Tay';
    if (level >= 5) return 'Học Việc';
    return 'Newbie';
}

export function calculateLevelProgress(xp: number, level: number): number {
    const xpForLevel = level * 100;
    const xpInLevel = xp % xpForLevel;
    return (xpInLevel / xpForLevel) * 100;
}

export function getRandomPlaceholderAvatar(seed: string): string {
    return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`;
}

export const defaultAchievements = [
    {
        id: 'first_login',
        title: 'Người Mới',
        description: 'Gia nhập Nuôi DEV',
    },
];

// Rank system
export function getRankInfo(rank: Rank | undefined): { name: string; color: string; emoji: string } {
    const rankData: Record<Rank, { name: string; color: string; emoji: string }> = {
        bronze: { name: 'Bronze', color: '#CD7F32', emoji: '' },
        silver: { name: 'Silver', color: '#C0C0C0', emoji: '' },
        gold: { name: 'Gold', color: '#FFD700', emoji: '' },
        platinum: { name: 'Platinum', color: '#E5E4E2', emoji: '' },
        diamond: { name: 'Diamond', color: '#B9F2FF', emoji: '' },
        master: { name: 'Master', color: '#FF4500', emoji: '' },
        legend: { name: 'Legend', color: '#9400D3', emoji: '' },
    };
    return rankData[rank || 'bronze'] || rankData.bronze;
}

// Vote limits
export const MAX_VOTES_PER_DAY = 10;
export const MAX_VOTES_PER_PROFILE_PER_DAY = 1;

// Visitor ID generator
export function generateVisitorId(): string {
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
