import { NextRequest, NextResponse } from 'next/server';
import { getProfileById, updateProfile, deleteProfile } from '@/lib/db';
import { UpdateProfileDTO, UserSession } from '@/types/profile';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single profile
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const profile = getProfileById(id);

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// PUT update profile - only owner can edit
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body: UpdateProfileDTO = await request.json();

        // Get current profile
        const profile = getProfileById(id);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Check if user is logged in and is the owner
        const sessionCookie = request.cookies.get('session');
        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Vui lòng đăng nhập để chỉnh sửa' }, { status: 401 });
        }

        const session: UserSession = JSON.parse(sessionCookie.value);

        // Check ownership - only owner can edit
        if (profile.userId && profile.userId !== session.userId) {
            return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa hồ sơ này' }, { status: 403 });
        }

        // Validate gallery images (max 3)
        if (body.galleryImages && body.galleryImages.length > 3) {
            body.galleryImages = body.galleryImages.slice(0, 3);
        }

        const updated = updateProfile(id, body);

        if (!updated) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

// DELETE profile - only owner can delete
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Get current profile
        const profile = getProfileById(id);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Check if user is logged in and is the owner
        const sessionCookie = request.cookies.get('session');
        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
        }

        const session: UserSession = JSON.parse(sessionCookie.value);

        // Check ownership
        if (profile.userId && profile.userId !== session.userId) {
            return NextResponse.json({ error: 'Bạn không có quyền xoá hồ sơ này' }, { status: 403 });
        }

        const deleted = deleteProfile(id);

        if (!deleted) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        console.error('Error deleting profile:', error);
        return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
    }
}
