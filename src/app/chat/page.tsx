'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { ChatMessage } from '@/types/profile';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo } from '@/lib/utils';

export default function ChatPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [guestName, setGuestName] = useState('');
    const [sending, setSending] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [newMsgCount, setNewMsgCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Only auto scroll if user is at bottom
        if (isAtBottom) {
            scrollToBottom();
            setNewMsgCount(0);
        } else if (messages.length > prevMessagesLengthRef.current) {
            // Show new message count if not at bottom
            setNewMsgCount(prev => prev + (messages.length - prevMessagesLengthRef.current));
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, isAtBottom]);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/chat?limit=200');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                // Filter pinned messages
                setPinnedMessages(data.filter((m: ChatMessage) => m.isPinned));
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsAtBottom(atBottom);
        if (atBottom) setNewMsgCount(0);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const senderName = user?.displayName || guestName.trim();
        if (!senderName) {
            alert('Vui lòng nhập tên của bạn');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage,
                    senderName,
                    senderAvatar: user?.avatar,
                    replyTo: replyTo?.id,
                }),
            });

            if (res.ok) {
                setNewMessage('');
                setReplyTo(null);
                setIsAtBottom(true);
                fetchMessages();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const filteredMessages = searchTerm
        ? messages.filter(m =>
            m.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.senderName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : messages;

    const getReplyMessage = (replyToId?: string) => {
        if (!replyToId) return null;
        return messages.find(m => m.id === replyToId);
    };

    return (
        <div className={styles.container}>
            <div className={styles.chatWrapper}>
                {/* Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>Chat Cộng Đồng</h1>
                        <span className={styles.onlineCount}>{messages.length} tin nhắn</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={`${styles.headerBtn} ${showSearch ? styles.active : ''}`}
                            onClick={() => setShowSearch(!showSearch)}
                        >
                            Tìm kiếm
                        </button>
                    </div>
                </div>

                {showSearch && (
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm tin nhắn..."
                            className={styles.searchInput}
                        />
                        {searchTerm && (
                            <span className={styles.searchCount}>{filteredMessages.length} kết quả</span>
                        )}
                    </div>
                )}

                {/* Pinned Messages */}
                {pinnedMessages.length > 0 && !searchTerm && (
                    <div className={styles.pinnedSection}>
                        <div className={styles.pinnedLabel}>Tin nhắn ghim</div>
                        {pinnedMessages.slice(0, 2).map(msg => (
                            <div key={msg.id} className={styles.pinnedMessage}>
                                <span className={styles.pinnedSender}>{msg.senderName}:</span>
                                <span className={styles.pinnedText}>{msg.message.substring(0, 50)}{msg.message.length > 50 ? '...' : ''}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Messages Area */}
                <div
                    className={styles.messagesArea}
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                >
                    <div className={styles.messagesList}>
                        {filteredMessages.map((msg) => {
                            const isOwn = user && msg.userId === user.id;
                            const replyMsg = getReplyMessage(msg.replyTo);

                            return (
                                <div
                                    key={msg.id}
                                    className={`${styles.messageRow} ${isOwn ? styles.own : ''}`}
                                >
                                    {!isOwn && (
                                        <div className={styles.messageAvatar}>
                                            {msg.senderAvatar ? (
                                                <img src={msg.senderAvatar} alt="" />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    {msg.senderName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={styles.messageContent}>
                                        {!isOwn && (
                                            <span className={styles.senderName}>{msg.senderName}</span>
                                        )}

                                        {replyMsg && (
                                            <div className={styles.replyPreview}>
                                                <span className={styles.replyName}>{replyMsg.senderName}</span>
                                                <span className={styles.replyText}>{replyMsg.message.substring(0, 40)}...</span>
                                            </div>
                                        )}

                                        <div className={styles.messageBubble}>
                                            <p className={styles.messageText}>{msg.message}</p>
                                        </div>

                                        <div className={styles.messageFooter}>
                                            <span className={styles.messageTime}>{formatTimeAgo(msg.createdAt)}</span>
                                            {user && !isOwn && (
                                                <button
                                                    className={styles.replyMsgBtn}
                                                    onClick={() => setReplyTo(msg)}
                                                >
                                                    Trả lời
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* New Message Indicator */}
                {newMsgCount > 0 && !isAtBottom && (
                    <button className={styles.newMsgIndicator} onClick={scrollToBottom}>
                        {newMsgCount} tin nhắn mới
                    </button>
                )}

                {/* Reply Preview */}
                {replyTo && (
                    <div className={styles.replyBar}>
                        <div className={styles.replyBarContent}>
                            <span className={styles.replyBarLabel}>Đang trả lời</span>
                            <span className={styles.replyBarName}>{replyTo.senderName}</span>
                            <span className={styles.replyBarText}>{replyTo.message.substring(0, 30)}...</span>
                        </div>
                        <button className={styles.cancelReply} onClick={() => setReplyTo(null)}>X</button>
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSubmit} className={styles.inputArea}>
                    {!user && (
                        <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Tên của bạn"
                            className={styles.nameInput}
                            maxLength={30}
                        />
                    )}

                    {user && (
                        <div className={styles.inputAvatar}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="" />
                            ) : (
                                <div className={styles.inputAvatarPlaceholder}>
                                    {user.displayName.charAt(0)}
                                </div>
                            )}
                        </div>
                    )}

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={replyTo ? `Trả lời ${replyTo.senderName}...` : "Nhập tin nhắn..."}
                        className={styles.messageInput}
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        className={styles.sendBtn}
                        disabled={sending || !newMessage.trim()}
                    >
                        {sending ? '...' : 'Gửi'}
                    </button>
                </form>
            </div>
        </div>
    );
}
