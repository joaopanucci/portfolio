import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({
  href,
  children,
  variant = "primary"
}: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-neutral-200"
      : "border border-white/15 text-white hover:bg-white/5";

  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center px-5 text-sm font-medium transition ${styles}`}
    >
      {children}
    </Link>
  );
}