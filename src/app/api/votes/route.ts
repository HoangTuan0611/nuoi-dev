import { NextRequest, NextResponse } from 'next/server';
import {
    addVote,
    hasVotedToday,
    getTodayVoteCount,
    generateId,
    updateProfileVotesAndRank,
    getProfileById
} from '@/lib/db';
import { Vote } from '@/types/profile';
import { MAX_VOTES_PER_DAY } from '@/lib/utils';

// POST - Vote for a profile
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { profileId, visitorId } = body;

        if (!profileId || !visitorId) {
            return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
        }

        // Check if profile exists
        const profile = getProfileById(profileId);
        if (!profile) {
            return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
        }

        // Check daily vote limit
        const todayVotes = getTodayVoteCount(visitorId);
        if (todayVotes >= MAX_VOTES_PER_DAY) {
            return NextResponse.json({
                error: `Bạn đã hết lượt vote hôm nay (${MAX_VOTES_PER_DAY} lượt/ngày)`,
                remainingVotes: 0
            }, { status: 429 });
        }

        // Check if already voted for this profile today
        if (hasVotedToday(visitorId, profileId)) {
            return NextResponse.json({
                error: 'Bạn đã ủng hộ người này hôm nay rồi! Quay lại mai nhé~',
                remainingVotes: MAX_VOTES_PER_DAY - todayVotes
            }, { status: 429 });
        }

        // Create vote
        const vote: Vote = {
            id: generateId('vote'),
            profileId,
            voterId: visitorId,
            createdAt: new Date().toISOString(),
        };

        addVote(vote);

        // Update profile votes and rank
        const updatedProfile = updateProfileVotesAndRank(profileId);

        return NextResponse.json({
            message: 'Ủng hộ thành công!',
            profile: updatedProfile,
            remainingVotes: MAX_VOTES_PER_DAY - todayVotes - 1,
        });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ error: 'Ủng hộ thất bại' }, { status: 500 });
    }
}

// GET - Get remaining votes for visitor
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const visitorId = searchParams.get('visitorId');

        if (!visitorId) {
            return NextResponse.json({ remainingVotes: MAX_VOTES_PER_DAY });
        }

        const todayVotes = getTodayVoteCount(visitorId);
        return NextResponse.json({
            remainingVotes: Math.max(0, MAX_VOTES_PER_DAY - todayVotes),
            todayVotes
        });
    } catch (error) {
        console.error('Get votes error:', error);
        return NextResponse.json({ remainingVotes: MAX_VOTES_PER_DAY });
    }
}
