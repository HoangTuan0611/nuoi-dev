import { NextRequest, NextResponse } from 'next/server';
import { likePost, deletePost, getPostById, updatePost, generateId } from '@/lib/db';
import { UserSession, Comment } from '@/types/profile';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST - Like a post
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const post = likePost(id);

        if (!post) {
            return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Like post error:', error);
        return NextResponse.json({ error: 'Thích bài viết thất bại' }, { status: 500 });
    }
}

// PUT - Add comment to post (with nested reply support)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const sessionCookie = request.cookies.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Vui lòng đăng nhập để bình luận' }, { status: 401 });
        }

        const session: UserSession = JSON.parse(sessionCookie.value);
        const { id } = await params;
        const body = await request.json();
        const { comment, parentId } = body;

        if (!comment || comment.trim() === '') {
            return NextResponse.json({ error: 'Bình luận không được để trống' }, { status: 400 });
        }

        const post = getPostById(id);
        if (!post) {
            return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 });
        }

        const newComment: Comment = {
            id: generateId('comment'),
            postId: id,
            userId: session.userId,
            authorName: session.displayName,
            authorAvatar: session.avatar,
            content: comment.trim().substring(0, 300),
            parentId: parentId || undefined,
            createdAt: new Date().toISOString(),
        };

        const updatedComments = [...(post.comments || []), newComment];
        const updated = updatePost(id, { comments: updatedComments });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Comment error:', error);
        return NextResponse.json({ error: 'Bình luận thất bại' }, { status: 500 });
    }
}

// DELETE - Delete a post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const sessionCookie = request.cookies.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const deleted = deletePost(id);

        if (!deleted) {
            return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Đã xoá bài viết' });
    } catch (error) {
        console.error('Delete post error:', error);
        return NextResponse.json({ error: 'Xoá bài viết thất bại' }, { status: 500 });
    }
}
