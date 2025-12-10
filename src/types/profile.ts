// Types for Profile system

export interface Profile {
    id: string;
    name: string;
    nickname?: string;
    avatar: string;
    bio: string;
    skills: string[];
    funFacts: string[];
    catchphrase?: string;
    mood: 'happy' | 'sad' | 'angry' | 'sleepy' | 'coding' | 'coffee' | 'debugging';
    level: number;
    xp: number;
    votes: number;
    rank: Rank;
    achievements: Achievement[];
    socialLinks: SocialLink[];
    galleryImages?: string[];
    createdAt: string;
    updatedAt: string;
    theme?: ProfileTheme;
    userId?: string;
}

export type Rank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'legend';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlockedAt?: string;
}

export interface SocialLink {
    platform: string;
    url: string;
}

export interface ProfileTheme {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundGradient?: string;
}

export interface CreateProfileDTO {
    name: string;
    nickname?: string;
    avatar?: string;
    bio?: string;
    skills?: string[];
    funFacts?: string[];
    catchphrase?: string;
    mood?: Profile['mood'];
    galleryImages?: string[];
}

export interface UpdateProfileDTO extends Partial<CreateProfileDTO> {
    achievements?: Achievement[];
    socialLinks?: SocialLink[];
    theme?: ProfileTheme;
}

// User/Auth types
export interface User {
    id: string;
    username: string;
    password: string;
    displayName: string;
    avatar?: string;
    profileId?: string;
    createdAt: string;
}

export interface UserSession {
    userId: string;
    username: string;
    displayName: string;
    avatar?: string;
    profileId?: string;
}

// Post types
export interface Post {
    id: string;
    userId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    type: 'normal' | 'support_call';
    targetProfileId?: string;
    images?: string[];
    likes: number;
    likedBy?: string[];
    comments: Comment[];
    isPinned?: boolean;
    createdAt: string;
}

// Comment type with nested replies
export interface Comment {
    id: string;
    postId: string;
    userId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    parentId?: string; // For nested replies
    replies?: Comment[];
    createdAt: string;
}

// Vote types
export interface Vote {
    id: string;
    profileId: string;
    voterId: string;
    createdAt: string;
}

// Chat types with room support
export interface ChatMessage {
    id: string;
    roomId?: string; // For different chat rooms
    userId?: string;
    senderName: string;
    senderAvatar?: string;
    message: string;
    replyTo?: string; // Reply to another message
    isPinned?: boolean;
    createdAt: string;
}

// Chat room
export interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
}

// Visitor tracking for vote limiting
export interface Visitor {
    visitorId: string;
    votesGiven: { profileId: string; count: number; lastVotedAt: string }[];
    lastActive: string;
}
