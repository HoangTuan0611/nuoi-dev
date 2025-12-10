import { NextResponse } from 'next/server';
import { getTopProfiles } from '@/lib/db';

// GET - Get leaderboard (top profiles by votes)
export async function GET() {
    try {
        const topProfiles = getTopProfiles(50);
        return NextResponse.json(topProfiles);
    } catch (error) {
        console.error('Get leaderboard error:', error);
        return NextResponse.json({ error: 'Lấy bảng xếp hạng thất bại' }, { status: 500 });
    }
}
