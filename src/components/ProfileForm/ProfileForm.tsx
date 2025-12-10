'use client';

import { useState, useRef } from 'react';
import styles from './ProfileForm.module.css';
import { Profile, CreateProfileDTO, UpdateProfileDTO } from '@/types/profile';

interface ProfileFormProps {
    profile?: Profile;
    onSubmit: (data: CreateProfileDTO | UpdateProfileDTO) => Promise<void>;
    isLoading?: boolean;
}

const moodOptions = [
    { value: 'happy', label: 'Vui vẻ' },
    { value: 'sad', label: 'Buồn' },
    { value: 'angry', label: 'Tức giận' },
    { value: 'sleepy', label: 'Buồn ngủ' },
    { value: 'coding', label: 'Đang code' },
    { value: 'coffee', label: 'Cần cà phê' },
    { value: 'debugging', label: 'Debug' },
];

export default function ProfileForm({ profile, onSubmit, isLoading }: ProfileFormProps) {
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        nickname: profile?.nickname || '',
        bio: profile?.bio || '',
        catchphrase: profile?.catchphrase || '',
        mood: profile?.mood || 'happy',
        skills: profile?.skills?.join(', ') || '',
        funFacts: profile?.funFacts?.join('\n') || '',
    });
    const [avatar, setAvatar] = useState(profile?.avatar || '');
    const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || '');
    const [galleryImages, setGalleryImages] = useState<string[]>(profile?.galleryImages || []);
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setAvatar(data.url);
            } else {
                alert('Upload thất bại!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Có lỗi khi upload!');
        } finally {
            setUploading(false);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (galleryImages.length >= 3) {
            alert('Tối đa 3 ảnh trong gallery');
            return;
        }

        setUploadingGallery(true);
        try {
            for (let i = 0; i < Math.min(files.length, 3 - galleryImages.length); i++) {
                const formData = new FormData();
                formData.append('file', files[i]);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    setGalleryImages(prev => [...prev, data.url]);
                }
            }
        } catch (error) {
            console.error('Gallery upload error:', error);
        } finally {
            setUploadingGallery(false);
            if (galleryInputRef.current) {
                galleryInputRef.current.value = '';
            }
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: CreateProfileDTO | UpdateProfileDTO = {
            name: formData.name,
            nickname: formData.nickname || undefined,
            bio: formData.bio || undefined,
            catchphrase: formData.catchphrase || undefined,
            mood: formData.mood as Profile['mood'],
            skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            funFacts: formData.funFacts ? formData.funFacts.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
            avatar: avatar || undefined,
            galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
        };

        await onSubmit(data);
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.avatarSection}>
                <div className={styles.avatarPreview}>
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <span>Chọn ảnh</span>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className={styles.fileInput}
                />
                <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? 'Đang tải...' : 'Chọn ảnh đại diện'}
                </button>
                <p className={styles.uploadHint}>hoặc nhập URL ảnh bên dưới</p>
                <input
                    type="text"
                    placeholder="URL ảnh đại diện"
                    value={avatar}
                    onChange={(e) => {
                        setAvatar(e.target.value);
                        setAvatarPreview(e.target.value);
                    }}
                    className={styles.input}
                />
            </div>

            {/* Gallery Images Section */}
            <div className={styles.gallerySection}>
                <h3 className={styles.sectionTitle}>Ảnh giới thiệu (tối đa 3)</h3>
                <p className={styles.sectionHint}>Thêm ảnh để khoe trong hồ sơ của bạn</p>

                <div className={styles.galleryGrid}>
                    {galleryImages.map((img, index) => (
                        <div key={index} className={styles.galleryItem}>
                            <img src={img} alt={`Gallery ${index + 1}`} />
                            <button
                                type="button"
                                className={styles.removeGalleryBtn}
                                onClick={() => removeGalleryImage(index)}
                            >
                                X
                            </button>
                        </div>
                    ))}

                    {galleryImages.length < 3 && (
                        <div className={styles.addGalleryItem}>
                            <input
                                type="file"
                                ref={galleryInputRef}
                                onChange={handleGalleryUpload}
                                accept="image/*"
                                multiple
                                className={styles.fileInput}
                            />
                            <button
                                type="button"
                                className={styles.addGalleryBtn}
                                onClick={() => galleryInputRef.current?.click()}
                                disabled={uploadingGallery}
                            >
                                {uploadingGallery ? 'Đang tải...' : `+ Thêm ảnh`}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.formGrid}>
                <div className={styles.field}>
                    <label className={styles.label}>Tên hiển thị *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={styles.input}
                        placeholder="Nhập tên của bạn"
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Nickname</label>
                    <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        className={styles.input}
                        placeholder="@nickname"
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Tâm trạng</label>
                    <select
                        value={formData.mood}
                        onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                        className={styles.select}
                    >
                        {moodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Câu nói cửa miệng</label>
                    <input
                        type="text"
                        value={formData.catchphrase}
                        onChange={(e) => setFormData({ ...formData, catchphrase: e.target.value })}
                        className={styles.input}
                        placeholder="VD: It works on my machine!"
                    />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label className={styles.label}>Giới thiệu bản thân</label>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className={styles.textarea}
                        placeholder="Viết gì đó về bản thân..."
                        rows={4}
                    />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label className={styles.label}>Skills (phân cách bằng dấu phẩy)</label>
                    <input
                        type="text"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        className={styles.input}
                        placeholder="JavaScript, React, CSS, Crying..."
                    />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label className={styles.label}>Fun Facts (mỗi dòng một fact)</label>
                    <textarea
                        value={formData.funFacts}
                        onChange={(e) => setFormData({ ...formData, funFacts: e.target.value })}
                        className={styles.textarea}
                        placeholder="Thích ăn mì gói&#10;Code bằng chân&#10;Ngủ gật trong meeting"
                        rows={4}
                    />
                </div>
            </div>

            <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading || uploading || uploadingGallery}
            >
                {isLoading ? 'Đang lưu...' : profile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ'}
            </button>
        </form>
    );
}
