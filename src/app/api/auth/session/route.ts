import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';
import { UserSession } from '@/types/profile';

// GET - Get current session
export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ user: null });
        }

        const session: UserSession = JSON.parse(sessionCookie.value);

        // Verify user still exists
        const user = getUserById(session.userId);
        if (!user) {
            const response = NextResponse.json({ user: null });
            response.cookies.set('session', '', { maxAge: 0, path: '/' });
            return response;
        }

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                profileId: user.profileId,
            },
        });
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json({ user: null });
    }
}
