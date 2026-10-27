import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "WONK", "opsz"] });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex" });

export const metadata: Metadata = {
  title: "FieldCall — paid calls for wildlife sightings",
  description:
    "Fund a call for sightings of a species in a place. Anyone submits an iNaturalist observation; GenLayer validators check it, look at the photos when the call asks, and pay the observer's wallet.",
  manifest: "/site.webmanifest",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  themeColor: "#EEF1E8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable} ${plex.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
