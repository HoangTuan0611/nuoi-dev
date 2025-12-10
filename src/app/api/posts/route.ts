import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, createPost, generateId, getProfileById } from '@/lib/db';
import { Post, UserSession } from '@/types/profile';

// GET - Get all posts
export async function GET() {
    try {
        const posts = getAllPosts();
        return NextResponse.json(posts);
    } catch (error) {
        console.error('Get posts error:', error);
        return NextResponse.json({ error: 'Lấy bài viết thất bại' }, { status: 500 });
    }
}

// POST - Create new post
export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Vui lòng đăng nhập để đăng bài' }, { status: 401 });
        }

        const session: UserSession = JSON.parse(sessionCookie.value);
        const body = await request.json();
        const { content, type, targetProfileId, images, isPinned } = body;

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Nội dung không được để trống' }, { status: 400 });
        }

        // Get author's profile avatar if they have one
        let authorAvatar: string | undefined = session.avatar;
        if (session.profileId) {
            const profile = getProfileById(session.profileId);
            if (profile) {
                authorAvatar = profile.avatar;
            }
        }

        // If it's a support call, verify target profile exists
        if (type === 'support_call' && targetProfileId) {
            const targetProfile = getProfileById(targetProfileId);
            if (!targetProfile) {
                return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
            }
        }

        // Validate images (max 3)
        let validImages: string[] = [];
        if (images && Array.isArray(images)) {
            validImages = images.slice(0, 3).filter((img: string) => typeof img === 'string' && img.trim() !== '');
        }

        const post: Post = {
            id: generateId('post'),
            userId: session.userId,
            authorName: session.displayName,
            authorAvatar,
            content: content.trim(),
            type: type || 'normal',
            targetProfileId,
            images: validImages.length > 0 ? validImages : undefined,
            likes: 0,
            likedBy: [],
            comments: [],
            isPinned: isPinned || false,
            createdAt: new Date().toISOString(),
        };

        const created = createPost(post);
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error('Create post error:', error);
        return NextResponse.json({ error: 'Đăng bài thất bại' }, { status: 500 });
    }
}
