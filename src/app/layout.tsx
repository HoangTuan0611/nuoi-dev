import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Nuôi DEV - Kho Hồ Sơ Của Các Dev Vui Vẻ",
  description: "Nơi các dev được 'nuôi' bằng mì gói và deadline. Tạo hồ sơ vui nhộn, ủng hộ bạn bè, leo rank và chat!",
  keywords: ["dev", "developer", "profile", "fun", "joke", "nuoi dev", "rank", "vote"],
  authors: [{ name: "Nuôi DEV Team" }],
  openGraph: {
    title: "Nuôi DEV - Kho Hồ Sơ Của Các Dev Vui Vẻ",
    description: "Nơi các dev được 'nuôi' bằng mì gói và deadline",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <Header />
          <main style={{ flex: 1 }}>
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
