import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';
import { UserSession } from '@/types/profile';

// PUT - Update user account
export async function PUT(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
        }

        const session: UserSession = JSON.parse(sessionCookie.value);
        const body = await request.json();
        const { displayName, avatar } = body;

        // Update user
        const updated = updateUser(session.userId, {
            displayName: displayName?.trim() || session.displayName,
            avatar: avatar || undefined,
        });

        if (!updated) {
            return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
        }

        // Update session cookie
        const newSession = {
            ...session,
            displayName: updated.displayName,
            avatar: updated.avatar,
        };

        const response = NextResponse.json({
            message: 'Cập nhật thành công!',
            user: {
                id: updated.id,
                username: updated.username,
                displayName: updated.displayName,
                avatar: updated.avatar,
                profileId: updated.profileId,
            },
        });

        response.cookies.set('session', JSON.stringify(newSession), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Cập nhật thất bại' }, { status: 500 });
    }
}
