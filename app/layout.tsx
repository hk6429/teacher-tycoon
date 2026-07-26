import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "良師養成記 · 教師專業素養養成遊戲",
  description: "你就是陳老師——用一學年 40 週的取捨，養成屬於你的教師之路",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          src="https://self-learning-orbit.pages.dev/platform-counter.js?v=1"
          data-site="teacher-tycoon"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.goatcounter={path:function(p){return location.host+p}}",
          }}
        />
        <script
          data-goatcounter="https://hk6429.goatcounter.com/count"
          async
          src="https://gc.zgo.at/count.js"
        />
      </body>
    </html>
  );
}
