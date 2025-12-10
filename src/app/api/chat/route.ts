import { NextRequest, NextResponse } from 'next/server';
import { getChatMessages, addChatMessage, generateId } from '@/lib/db';
import { ChatMessage, UserSession } from '@/types/profile';

// GET - Get chat messages
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '200');

        const messages = getChatMessages(limit);
        return NextResponse.json(messages);
    } catch (error) {
        console.error('Get chat error:', error);
        return NextResponse.json({ error: 'Lấy tin nhắn thất bại' }, { status: 500 });
    }
}

// POST - Send chat message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, senderName, senderAvatar, replyTo } = body;

        if (!message || message.trim() === '') {
            return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 });
        }

        if (!senderName || senderName.trim() === '') {
            return NextResponse.json({ error: 'Tên người gửi là bắt buộc' }, { status: 400 });
        }

        // Check if user is logged in
        const sessionCookie = request.cookies.get('session');
        let userId: string | undefined;
        let avatar: string | undefined = senderAvatar;

        if (sessionCookie?.value) {
            const session: UserSession = JSON.parse(sessionCookie.value);
            userId = session.userId;
            avatar = session.avatar || senderAvatar;
        }

        const chatMessage: ChatMessage = {
            id: generateId('msg'),
            userId,
            senderName: senderName.trim().substring(0, 30),
            senderAvatar: avatar,
            message: message.trim().substring(0, 500),
            replyTo: replyTo || undefined,
            createdAt: new Date().toISOString(),
        };

        const created = addChatMessage(chatMessage);
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error('Send chat error:', error);
        return NextResponse.json({ error: 'Gửi tin nhắn thất bại' }, { status: 500 });
    }
}
