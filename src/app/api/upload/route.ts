import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
        }

        // Check if running on Vercel
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

        if (isVercel && process.env.BLOB_READ_WRITE_TOKEN) {
            // Use Vercel Blob storage in production
            const blob = await put(file.name, file, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            return NextResponse.json({
                url: blob.url,
                message: 'Upload successful'
            });
        } else {
            // Local development - use local file system
            const { writeFile, mkdir } = await import('fs/promises');
            const { existsSync } = await import('fs');
            const path = await import('path');

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create uploads directory if not exists
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }

            // Generate unique filename
            const ext = file.name.split('.').pop();
            const filename = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
            const filepath = path.join(uploadDir, filename);

            await writeFile(filepath, buffer);

            return NextResponse.json({
                url: `/uploads/${filename}`,
                message: 'Upload successful'
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
