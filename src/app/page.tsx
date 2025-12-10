'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import ProfileCard from '@/components/ProfileCard';
import { Profile } from '@/types/profile';
import { useVisitor } from '@/hooks/useVisitor';

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { remainingVotes } = useVisitor();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProfiles(profiles.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể xoá');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProfiles = [...filteredProfiles].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Chào mừng đến với <span className={styles.highlight}>Nuôi DEV</span>
        </h1>
        <p className={styles.subtitle}>
          Nơi tập hợp những hồ sơ độc đáo của các dev. Tạo hồ sơ, ủng hộ nhau, leo rank và chat giao lưu!
        </p>
        <div className={styles.ctaButtons}>
          <Link href="/create" className={styles.ctaButton}>
            Tạo Hồ Sơ Mới
          </Link>
          <Link href="/leaderboard" className={styles.ctaSecondary}>
            Xem Bảng Xếp Hạng
          </Link>
        </div>
        <div className={styles.voteInfo}>
          Bạn còn <strong>{remainingVotes}</strong> lượt ủng hộ hôm nay
        </div>
      </section>

      <section className={styles.profilesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Các Hồ Sơ ({profiles.length})
          </h2>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Tìm kiếm dev..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Đang tải các dev...</p>
          </div>
        ) : sortedProfiles.length > 0 ? (
          <div className={styles.profilesGrid}>
            {sortedProfiles.map((profile, index) => (
              <div
                key={profile.id}
                style={{ animationDelay: `${index * 0.05}s` }}
                className={styles.cardWrapper}
              >
                <ProfileCard
                  profile={profile}
                  onDelete={handleDelete}
                  rank={index + 1}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>Chưa có hồ sơ nào</h3>
            <p>Hãy là người đầu tiên tạo hồ sơ nhé!</p>
            <Link href="/create" className={styles.emptyButton}>
              Tạo Hồ Sơ Đầu Tiên
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
