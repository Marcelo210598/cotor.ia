import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "COTOR.IA — copiloto de engenharia de prompts",
    template: "%s · COTOR.IA",
  },
  description:
    "Você diz a intenção. O COTOR faz a engenharia do prompt: estrutura profissional, score técnico e otimização em loop.",
  applicationName: "COTOR.IA",
  openGraph: {
    title: "COTOR.IA — copiloto de engenharia de prompts",
    description:
      "Você diz a intenção. O COTOR faz a engenharia do prompt: estrutura profissional, score técnico e otimização em loop.",
    url: siteUrl,
    siteName: "COTOR.IA",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "COTOR.IA — copiloto de engenharia de prompts",
    description:
      "Você diz a intenção. O COTOR faz a engenharia do prompt.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
