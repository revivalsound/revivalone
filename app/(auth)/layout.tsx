import type { Metadata } from "next";
import "./auth.css";

export const metadata: Metadata = {
  title: "Account | Revival One",
  description: "Join Revival One or continue your Kingdom journey.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-page">{children}</main>;
}
