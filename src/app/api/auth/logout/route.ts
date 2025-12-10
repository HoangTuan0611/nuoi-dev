import { NextResponse } from 'next/server';

// POST - Logout
export async function POST() {
    const response = NextResponse.json({ message: 'Đăng xuất thành công' });

    // Clear session cookie
    response.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    return response;
}
