import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, createUser, hashPassword, generateId } from '@/lib/db';
import { User } from '@/types/profile';

// POST - Register new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password, displayName, avatar } = body;

        // Validation
        if (!username || !password) {
            return NextResponse.json({ error: 'Username và password là bắt buộc' }, { status: 400 });
        }

        if (username.length < 3 || username.length > 20) {
            return NextResponse.json({ error: 'Username phải từ 3-20 ký tự' }, { status: 400 });
        }

        if (password.length < 4) {
            return NextResponse.json({ error: 'Password phải ít nhất 4 ký tự' }, { status: 400 });
        }

        // Check if username exists
        const existingUser = getUserByUsername(username);
        if (existingUser) {
            return NextResponse.json({ error: 'Username đã tồn tại' }, { status: 400 });
        }

        // Create user
        const newUser: User = {
            id: generateId('user'),
            username: username.toLowerCase().trim(),
            password: hashPassword(password),
            displayName: displayName?.trim() || username,
            avatar: avatar || undefined,
            createdAt: new Date().toISOString(),
        };

        createUser(newUser);

        // Create session cookie
        const session = {
            userId: newUser.id,
            username: newUser.username,
            displayName: newUser.displayName,
            avatar: newUser.avatar,
            profileId: undefined,
        };

        const response = NextResponse.json({
            message: 'Đăng ký thành công!',
            user: {
                id: newUser.id,
                username: newUser.username,
                displayName: newUser.displayName,
                avatar: newUser.avatar,
            },
        }, { status: 201 });

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
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Đăng ký thất bại' }, { status: 500 });
    }
}
