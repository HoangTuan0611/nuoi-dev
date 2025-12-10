'use client';

import { useState, useEffect } from 'react';
import { generateVisitorId } from '@/lib/utils';

const VISITOR_KEY = 'nuoidev_visitor_id';

export function useVisitor() {
    const [visitorId, setVisitorId] = useState<string>('');
    const [remainingVotes, setRemainingVotes] = useState<number>(10);

    useEffect(() => {
        // Get or create visitor ID
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = generateVisitorId();
            localStorage.setItem(VISITOR_KEY, id);
        }
        setVisitorId(id);

        // Fetch remaining votes
        fetchRemainingVotes(id);
    }, []);

    const fetchRemainingVotes = async (id: string) => {
        try {
            const res = await fetch(`/api/votes?visitorId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setRemainingVotes(data.remainingVotes);
            }
        } catch (error) {
            console.error('Error fetching votes:', error);
        }
    };

    const vote = async (profileId: string): Promise<{ success: boolean; error?: string; remainingVotes?: number }> => {
        try {
            const res = await fetch('/api/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, visitorId }),
            });

            const data = await res.json();

            if (res.ok) {
                setRemainingVotes(data.remainingVotes);
                return { success: true, remainingVotes: data.remainingVotes };
            } else {
                if (data.remainingVotes !== undefined) {
                    setRemainingVotes(data.remainingVotes);
                }
                return { success: false, error: data.error, remainingVotes: data.remainingVotes };
            }
        } catch (error) {
            return { success: false, error: 'Ủng hộ thất bại' };
        }
    };

    const refreshVotes = () => {
        if (visitorId) {
            fetchRemainingVotes(visitorId);
        }
    };

    return { visitorId, remainingVotes, vote, refreshVotes };
}
