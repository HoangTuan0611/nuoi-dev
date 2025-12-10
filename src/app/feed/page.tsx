'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { Post, Profile, Comment } from '@/types/profile';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo } from '@/lib/utils';

export default function FeedPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<'normal' | 'support_call'>('normal');
    const [targetProfileId, setTargetProfileId] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [expandedPost, setExpandedPost] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; authorName: string } | null>(null);
    const [commentingOn, setCommentingOn] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [postsRes, profilesRes] = await Promise.all([
                fetch('/api/posts'),
                fetch('/api/profiles'),
            ]);

            if (postsRes.ok) setPosts(await postsRes.json());
            if (profilesRes.ok) setProfiles(await profilesRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (images.length >= 3) return;

        setUploading(true);
        try {
            for (let i = 0; i < Math.min(files.length, 3 - images.length); i++) {
                const formData = new FormData();
                formData.append('file', files[i]);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (res.ok) {
                    const data = await res.json();
                    setImages(prev => [...prev, data.url]);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleShareMyProfile = () => {
        if (user?.profileId) {
            setPostType('support_call');
            setTargetProfileId(user.profileId);
            setContent('Hãy ủng hộ mình nhé!');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || posting) return;

        setPosting(true);
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    type: postType,
                    targetProfileId: postType === 'support_call' ? targetProfileId : undefined,
                    images: images.length > 0 ? images : undefined,
                }),
            });
            if (res.ok) {
                setContent('');
                setPostType('normal');
                setTargetProfileId('');
                setImages([]);
                fetchData();
            }
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            await fetch(`/api/posts/${postId}`, { method: 'POST' });
            fetchData();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleComment = async (postId: string) => {
        const commentText = commentInputs[postId];
        if (!commentText?.trim()) return;

        setCommentingOn(postId);
        try {
            const res = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comment: commentText,
                    parentId: replyingTo?.postId === postId ? replyingTo.commentId : undefined,
                }),
            });
            if (res.ok) {
                setCommentInputs(prev => ({ ...prev, [postId]: '' }));
                setReplyingTo(null);
                fetchData();
            }
        } catch (error) {
            console.error('Error commenting:', error);
        } finally {
            setCommentingOn(null);
        }
    };

    const getTargetProfile = (profileId?: string) => profiles.find(p => p.id === profileId);
    const myProfile = user?.profileId ? profiles.find(p => p.id === user.profileId) : null;

    // Build nested comments
    const buildNestedComments = (comments: Comment[]) => {
        const map = new Map<string, Comment>();
        const roots: Comment[] = [];

        comments.forEach(c => map.set(c.id, { ...c, replies: [] }));
        comments.forEach(c => {
            const comment = map.get(c.id)!;
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId)!.replies!.push(comment);
            } else {
                roots.push(comment);
            }
        });
        return roots;
    };

    const renderComment = (comment: Comment, postId: string, depth: number = 0) => (
        <div key={comment.id} className={styles.commentItem} style={{ marginLeft: depth * 24 }}>
            <div className={styles.commentInner}>
                {comment.authorAvatar ? (
                    <img src={comment.authorAvatar} alt="" className={styles.commentAvatar} />
                ) : (
                    <div className={styles.commentAvatarPlaceholder}>
                        {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className={styles.commentContent}>
                    <div className={styles.commentBubble}>
                        <span className={styles.commentAuthor}>{comment.authorName}</span>
                        <p className={styles.commentText}>{comment.content}</p>
                    </div>
                    <div className={styles.commentMeta}>
                        <span className={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</span>
                        {user && (
                            <button
                                className={styles.replyBtn}
                                onClick={() => setReplyingTo({ postId, commentId: comment.id, authorName: comment.authorName })}
                            >
                                Trả lời
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {comment.replies && comment.replies.map(reply => renderComment(reply, postId, depth + 1))}
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Bài Viết</h1>
                <p className={styles.subtitle}>Chia sẻ, kêu gọi ủng hộ và tương tác với cộng đồng</p>
            </div>

            {user ? (
                <div className={styles.createPostCard}>
                    <div className={styles.createPostHeader}>
                        {user.avatar ? (
                            <img src={user.avatar} alt="" className={styles.createPostAvatar} />
                        ) : (
                            <div className={styles.createPostAvatarPlaceholder}>
                                {user.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className={styles.createPostName}>{user.displayName}</span>
                    </div>

                    {user.profileId && myProfile && (
                        <button type="button" className={styles.shareMyProfileBtn} onClick={handleShareMyProfile}>
                            Chia sẻ hồ sơ của tôi để kêu gọi ủng hộ
                        </button>
                    )}

                    <form onSubmit={handleSubmit} className={styles.postForm}>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Bạn đang nghĩ gì?"
                            className={styles.textarea}
                            rows={4}
                            maxLength={1000}
                        />

                        {images.length > 0 && (
                            <div className={styles.imagePreviewList}>
                                {images.map((img, index) => (
                                    <div key={index} className={styles.imagePreviewItem}>
                                        <img src={img} alt="" />
                                        <button type="button" className={styles.removeImageBtn} onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}>X</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.postFormActions}>
                            <div className={styles.postOptions}>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className={styles.fileInput} />
                                <button type="button" className={styles.addMediaBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading || images.length >= 3}>
                                    {uploading ? 'Đang tải...' : `Ảnh ${images.length}/3`}
                                </button>

                                <div className={styles.postTypeSelector}>
                                    <button type="button" className={`${styles.typeBtn} ${postType === 'normal' ? styles.active : ''}`} onClick={() => { setPostType('normal'); setTargetProfileId(''); }}>Thường</button>
                                    <button type="button" className={`${styles.typeBtn} ${postType === 'support_call' ? styles.active : ''}`} onClick={() => setPostType('support_call')}>Kêu gọi</button>
                                </div>

                                {postType === 'support_call' && (
                                    <select value={targetProfileId} onChange={(e) => setTargetProfileId(e.target.value)} className={styles.profileSelect}>
                                        <option value="">Chọn hồ sơ</option>
                                        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}{p.id === user.profileId ? ' (Tôi)' : ''}</option>)}
                                    </select>
                                )}
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={posting || !content.trim() || uploading}>
                                {posting ? 'Đang đăng...' : 'Đăng bài'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className={styles.loginPrompt}>
                    <Link href="/login">Đăng nhập</Link> để đăng bài và kêu gọi ủng hộ
                </div>
            )}

            {loading ? (
                <div className={styles.loading}><div className={styles.spinner}></div></div>
            ) : posts.length > 0 ? (
                <div className={styles.feed}>
                    {posts.map(post => {
                        const targetProfile = getTargetProfile(post.targetProfileId);
                        const isExpanded = expandedPost === post.id;
                        const nestedComments = buildNestedComments(post.comments || []);

                        return (
                            <article key={post.id} className={styles.postCard}>
                                {post.isPinned && <div className={styles.pinnedBadge}>Ghim</div>}

                                {/* Post Header */}
                                <div className={styles.postHeader}>
                                    {post.authorAvatar ? (
                                        <img src={post.authorAvatar} alt="" className={styles.postAuthorAvatar} />
                                    ) : (
                                        <div className={styles.postAuthorAvatarPlaceholder}>{post.authorName.charAt(0).toUpperCase()}</div>
                                    )}
                                    <div className={styles.postMeta}>
                                        <span className={styles.postAuthorName}>{post.authorName}</span>
                                        <span className={styles.postTime}>{formatTimeAgo(post.createdAt)}</span>
                                    </div>
                                    {post.type === 'support_call' && <span className={styles.supportTag}>Kêu gọi ủng hộ</span>}
                                </div>

                                {/* Post Content */}
                                <div className={styles.postBody}>
                                    <p className={styles.postContent}>{post.content}</p>
                                </div>

                                {/* Post Images Banner */}
                                {post.images && post.images.length > 0 && (
                                    <div className={styles.postBanner}>
                                        {post.images.length === 1 ? (
                                            <img src={post.images[0]} alt="" className={styles.bannerSingle} />
                                        ) : post.images.length === 2 ? (
                                            <div className={styles.bannerDouble}>
                                                {post.images.map((img, i) => <img key={i} src={img} alt="" />)}
                                            </div>
                                        ) : (
                                            <div className={styles.bannerTriple}>
                                                <img src={post.images[0]} alt="" className={styles.bannerMain} />
                                                <div className={styles.bannerSide}>
                                                    <img src={post.images[1]} alt="" />
                                                    <img src={post.images[2]} alt="" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Target Profile Card */}
                                {post.type === 'support_call' && targetProfile && (
                                    <Link href={`/profile/${targetProfile.id}`} className={styles.targetProfileCard}>
                                        <img src={targetProfile.avatar} alt="" className={styles.targetAvatar} />
                                        <div className={styles.targetInfo}>
                                            <span className={styles.targetName}>{targetProfile.name}</span>
                                            <span className={styles.targetVotes}>{targetProfile.votes || 0} ủng hộ</span>
                                        </div>
                                        <span className={styles.supportBtn}>Ủng hộ ngay</span>
                                    </Link>
                                )}

                                {/* Post Actions */}
                                <div className={styles.postActions}>
                                    <button className={styles.actionBtn} onClick={() => handleLike(post.id)}>
                                        +{post.likes} Thích
                                    </button>
                                    <button className={styles.actionBtn} onClick={() => setExpandedPost(isExpanded ? null : post.id)}>
                                        {(post.comments?.length || 0)} Bình luận
                                    </button>
                                </div>

                                {/* Comments Section */}
                                {isExpanded && (
                                    <div className={styles.commentsSection}>
                                        {nestedComments.length > 0 && (
                                            <div className={styles.commentsList}>
                                                {nestedComments.map(c => renderComment(c, post.id))}
                                            </div>
                                        )}

                                        {replyingTo?.postId === post.id && (
                                            <div className={styles.replyingToBar}>
                                                Đang trả lời {replyingTo.authorName}
                                                <button onClick={() => setReplyingTo(null)}>Huỷ</button>
                                            </div>
                                        )}

                                        {user ? (
                                            <div className={styles.commentInputWrapper}>
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="" className={styles.commentInputAvatar} />
                                                ) : (
                                                    <div className={styles.commentInputAvatarPlaceholder}>{user.displayName.charAt(0)}</div>
                                                )}
                                                <input
                                                    type="text"
                                                    value={commentInputs[post.id] || ''}
                                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                    placeholder={replyingTo?.postId === post.id ? `Trả lời ${replyingTo.authorName}...` : "Viết bình luận..."}
                                                    className={styles.commentInput}
                                                    maxLength={300}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(post.id); } }}
                                                />
                                                <button className={styles.sendCommentBtn} onClick={() => handleComment(post.id)} disabled={commentingOn === post.id || !commentInputs[post.id]?.trim()}>
                                                    {commentingOn === post.id ? '...' : 'Gửi'}
                                                </button>
                                            </div>
                                        ) : (
                                            <p className={styles.loginToComment}><Link href="/login">Đăng nhập</Link> để bình luận</p>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.empty}>Chưa có bài viết nào. Hãy là người đầu tiên!</div>
            )}
        </div>
    );
}
