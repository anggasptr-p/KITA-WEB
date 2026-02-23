import "./globals.css";
import { Inter } from "next/font/google";

// Set font Inter biar web lu kelihatan modern
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kita Space | Cinema & Chat",
  description: "Tempat nonton bareng dan chatting rahasia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-black antialiased`}>
        {/* Children ini adalah tempat kode page.js lu muncul */}
        {children}
      </body>
    </html>
  );
}
