'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoText}>Nuôi</span>
                    <span className={styles.logoDev}>DEV</span>
                </Link>

                <nav className={styles.nav}>
                    <Link
                        href="/"
                        className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}
                    >
                        Trang Chủ
                    </Link>
                    <Link
                        href="/leaderboard"
                        className={`${styles.navLink} ${pathname === '/leaderboard' ? styles.active : ''}`}
                    >
                        Bảng Xếp Hạng
                    </Link>
                    <Link
                        href="/feed"
                        className={`${styles.navLink} ${pathname === '/feed' ? styles.active : ''}`}
                    >
                        Bài Viết
                    </Link>
                    <Link
                        href="/chat"
                        className={`${styles.navLink} ${pathname === '/chat' ? styles.active : ''}`}
                    >
                        Chat
                    </Link>
                </nav>

                <div className={styles.authSection}>
                    {loading ? (
                        <span className={styles.loading}>...</span>
                    ) : user ? (
                        <div className={styles.userMenu}>
                            <Link href="/me" className={styles.userProfile}>
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.displayName}
                                        className={styles.userAvatar}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user.displayName}`;
                                        }}
                                    />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {user.displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className={styles.username}>{user.displayName}</span>
                            </Link>
                            <button onClick={logout} className={styles.logoutBtn}>
                                Thoát
                            </button>
                        </div>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link href="/login" className={styles.loginBtn}>
                                Đăng nhập
                            </Link>
                            <Link href="/register" className={styles.registerBtn}>
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
