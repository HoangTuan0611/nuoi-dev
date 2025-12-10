import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, hashPassword } from '@/lib/db';

// POST - Login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Username và password là bắt buộc' }, { status: 400 });
        }

        // Find user
        const user = getUserByUsername(username);
        if (!user) {
            return NextResponse.json({ error: 'Sai username hoặc password' }, { status: 401 });
        }

        // Check password
        if (user.password !== hashPassword(password)) {
            return NextResponse.json({ error: 'Sai username hoặc password' }, { status: 401 });
        }

        // Create session
        const session = {
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            profileId: user.profileId,
        };

        const response = NextResponse.json({
            message: 'Đăng nhập thành công!',
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                profileId: user.profileId,
            },
        });

        // Set session cookie
        response.cookies.set('session', JSON.stringify(session), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Đăng nhập thất bại' }, { status: 500 });
    }
}
