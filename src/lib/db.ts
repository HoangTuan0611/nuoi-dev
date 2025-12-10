// Hybrid database: Vercel KV for production, JSON files for local dev
import { Profile, User, Post, ChatMessage, Vote, Rank, Comment } from '@/types/profile';
import crypto from 'crypto';

// Check if running on Vercel (serverless)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

// Vercel KV client (only imported in production)
let kv: any = null;
if (isVercel) {
    try {
        kv = require('@vercel/kv').kv;
    } catch (e) {
        console.warn('Vercel KV not available, using in-memory fallback');
    }
}

// In-memory cache for development/fallback
const memoryStore = new Map<string, any>();

// Local file storage for development
let fs: any = null;
let path: any = null;
if (!isVercel) {
    fs = require('fs');
    path = require('path');
}

const DATA_DIR = isVercel ? '' : require('path').join(process.cwd(), 'data');

// Ensure data directory exists (local only)
function ensureDataDir() {
    if (!isVercel && fs && !fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function getFilePath(name: string): string {
    if (!path) return '';
    return path.join(DATA_DIR, `${name}.json`);
}

// Read data from KV or local file
async function readDataAsync<T>(name: string, defaultValue: T): Promise<T> {
    if (isVercel && kv) {
        try {
            const data = await kv.get(name);
            return data || defaultValue;
        } catch (e) {
            console.error('KV read error:', e);
            return memoryStore.get(name) || defaultValue;
        }
    } else if (fs) {
        ensureDataDir();
        const filePath = getFilePath(name);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return memoryStore.get(name) || defaultValue;
}

// Synchronous wrapper (uses cached data)
function readData<T>(name: string, defaultValue: T): T {
    if (isVercel) {
        return memoryStore.get(name) || defaultValue;
    } else if (fs) {
        ensureDataDir();
        const filePath = getFilePath(name);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return defaultValue;
}

// Write data to KV or local file
async function writeDataAsync<T>(name: string, data: T): Promise<void> {
    if (isVercel && kv) {
        try {
            await kv.set(name, data);
            memoryStore.set(name, data);
        } catch (e) {
            console.error('KV write error:', e);
            memoryStore.set(name, data);
        }
    } else if (fs) {
        ensureDataDir();
        fs.writeFileSync(getFilePath(name), JSON.stringify(data, null, 2));
    } else {
        memoryStore.set(name, data);
    }
}

function writeData<T>(name: string, data: T): void {
    if (isVercel) {
        memoryStore.set(name, data);
        // Async write in background
        writeDataAsync(name, data).catch(e => console.error('Background write error:', e));
    } else if (fs) {
        ensureDataDir();
        fs.writeFileSync(getFilePath(name), JSON.stringify(data, null, 2));
    } else {
        memoryStore.set(name, data);
    }
}

// ============= PROFILES =============
export function getAllProfiles(): Profile[] {
    const data = readData<{ profiles: Profile[] }>('profiles', { profiles: [] });
    return data.profiles;
}

export function getProfileById(id: string): Profile | null {
    const profiles = getAllProfiles();
    return profiles.find(p => p.id === id) || null;
}

export function createProfile(profile: Profile): Profile {
    const data = readData<{ profiles: Profile[] }>('profiles', { profiles: [] });
    data.profiles.push(profile);
    writeData('profiles', data);
    return profile;
}

export function updateProfile(id: string, updates: Partial<Profile>): Profile | null {
    const data = readData<{ profiles: Profile[] }>('profiles', { profiles: [] });
    const index = data.profiles.findIndex(p => p.id === id);
    if (index === -1) return null;

    data.profiles[index] = {
        ...data.profiles[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    writeData('profiles', data);
    return data.profiles[index];
}

export function deleteProfile(id: string): boolean {
    const data = readData<{ profiles: Profile[] }>('profiles', { profiles: [] });
    const filtered = data.profiles.filter(p => p.id !== id);
    if (filtered.length === data.profiles.length) return false;
    writeData('profiles', { profiles: filtered });
    return true;
}

export function getTopProfiles(limit: number = 10): Profile[] {
    const profiles = getAllProfiles();
    return profiles.sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, limit);
}

// ============= USERS =============
export function getAllUsers(): User[] {
    const data = readData<{ users: User[] }>('users', { users: [] });
    return data.users;
}

export function getUserById(id: string): User | null {
    const users = getAllUsers();
    return users.find(u => u.id === id) || null;
}

export function getUserByUsername(username: string): User | null {
    const users = getAllUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export function createUser(user: User): User {
    const data = readData<{ users: User[] }>('users', { users: [] });
    data.users.push(user);
    writeData('users', data);
    return user;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
    const data = readData<{ users: User[] }>('users', { users: [] });
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    data.users[index] = { ...data.users[index], ...updates };
    writeData('users', data);
    return data.users[index];
}

// ============= POSTS =============
export function getAllPosts(): Post[] {
    const data = readData<{ posts: Post[] }>('posts', { posts: [] });
    // Sort: pinned first, then by date
    return data.posts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function getPostById(id: string): Post | null {
    const posts = getAllPosts();
    return posts.find(p => p.id === id) || null;
}

export function createPost(post: Post): Post {
    const data = readData<{ posts: Post[] }>('posts', { posts: [] });
    data.posts.push(post);
    writeData('posts', data);
    return post;
}

export function updatePost(id: string, updates: Partial<Post>): Post | null {
    const data = readData<{ posts: Post[] }>('posts', { posts: [] });
    const index = data.posts.findIndex(p => p.id === id);
    if (index === -1) return null;
    data.posts[index] = { ...data.posts[index], ...updates };
    writeData('posts', data);
    return data.posts[index];
}

export function deletePost(id: string): boolean {
    const data = readData<{ posts: Post[] }>('posts', { posts: [] });
    const filtered = data.posts.filter(p => p.id !== id);
    if (filtered.length === data.posts.length) return false;
    writeData('posts', { posts: filtered });
    return true;
}

export function likePost(id: string): Post | null {
    const data = readData<{ posts: Post[] }>('posts', { posts: [] });
    const index = data.posts.findIndex(p => p.id === id);
    if (index === -1) return null;
    data.posts[index].likes = (data.posts[index].likes || 0) + 1;
    writeData('posts', data);
    return data.posts[index];
}

// ============= CHAT =============
export function getChatMessages(limit: number = 100): ChatMessage[] {
    const data = readData<{ messages: ChatMessage[] }>('chat', { messages: [] });
    return data.messages
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-limit);
}

export function addChatMessage(message: ChatMessage): ChatMessage {
    const data = readData<{ messages: ChatMessage[] }>('chat', { messages: [] });
    data.messages.push(message);
    // Keep only last 500 messages
    if (data.messages.length > 500) {
        data.messages = data.messages.slice(-500);
    }
    writeData('chat', data);
    return message;
}

// ============= VOTES =============
export function getVotes(): Vote[] {
    const data = readData<{ votes: Vote[] }>('votes', { votes: [] });
    return data.votes;
}

export function addVote(vote: Vote): Vote {
    const data = readData<{ votes: Vote[] }>('votes', { votes: [] });
    data.votes.push(vote);
    writeData('votes', data);
    return vote;
}

export function getVotesForProfile(profileId: string): number {
    const votes = getVotes();
    return votes.filter(v => v.profileId === profileId).length;
}

export function hasVotedToday(visitorId: string, profileId: string): boolean {
    const votes = getVotes();
    const today = new Date().toISOString().split('T')[0];
    return votes.some(v =>
        v.voterId === visitorId &&
        v.profileId === profileId &&
        v.createdAt.startsWith(today)
    );
}

export function getTodayVoteCount(visitorId: string): number {
    const votes = getVotes();
    const today = new Date().toISOString().split('T')[0];
    return votes.filter(v => v.voterId === visitorId && v.createdAt.startsWith(today)).length;
}

// ============= HELPERS =============
export function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export function calculateRank(votes: number): Rank {
    if (votes >= 1000) return 'legend';
    if (votes >= 500) return 'master';
    if (votes >= 200) return 'diamond';
    if (votes >= 100) return 'platinum';
    if (votes >= 50) return 'gold';
    if (votes >= 20) return 'silver';
    return 'bronze';
}

export function updateProfileVotesAndRank(profileId: string): Profile | null {
    const votes = getVotesForProfile(profileId);
    const rank = calculateRank(votes);
    return updateProfile(profileId, { votes, rank });
}
