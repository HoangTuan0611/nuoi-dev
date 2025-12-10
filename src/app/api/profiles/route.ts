import { NextRequest, NextResponse } from 'next/server';
import { getAllProfiles, createProfile, generateId, updateUser, getUserById } from '@/lib/db';
import { Profile, CreateProfileDTO, UserSession, Rank } from '@/types/profile';
import { getRandomPlaceholderAvatar, defaultAchievements } from '@/lib/utils';

// GET all profiles
export async function GET() {
    try {
        const profiles = getAllProfiles();
        return NextResponse.json(profiles);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
}

// POST create new profile
export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('session');
        let session: UserSession | null = null;

        if (sessionCookie?.value) {
            session = JSON.parse(sessionCookie.value);
        }

        const body: CreateProfileDTO = await request.json();

        if (!body.name || body.name.trim() === '') {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const newProfile: Profile = {
            id: generateId('profile'),
            name: body.name.trim(),
            nickname: body.nickname?.trim() || '',
            avatar: body.avatar || getRandomPlaceholderAvatar(body.name),
            bio: body.bio || 'Chưa có bio... 🤷',
            skills: body.skills || [],
            funFacts: body.funFacts || [],
            catchphrase: body.catchphrase || '',
            mood: body.mood || 'happy',
            level: 1,
            xp: 0,
            votes: 0,
            rank: 'bronze' as Rank,
            achievements: [
                {
                    ...defaultAchievements[0],
                    unlockedAt: new Date().toISOString(),
                },
            ],
            socialLinks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: session?.userId,
        };

        const created = createProfile(newProfile);

        // If user is logged in, link profile to user
        if (session?.userId) {
            updateUser(session.userId, { profileId: created.id });

            // Update session cookie with profileId
            const updatedSession = { ...session, profileId: created.id };
            const response = NextResponse.json(created, { status: 201 });
            response.cookies.set('session', JSON.stringify(updatedSession), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            });
            return response;
        }

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }
}
