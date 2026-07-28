import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import "./platform.css";

export const metadata: Metadata = {
  title: "Revival One App",
  description: "Your digital home for community, gatherings, discipleship, and Kingdom impact.",
};

export default function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
