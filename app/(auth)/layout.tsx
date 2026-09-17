import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div className="flex flex-1 items-start justify-center px-6 pb-20 pt-6 md:items-center md:pt-0">
        <div className="w-full max-w-[26rem]">{children}</div>
      </div>
    </main>
  );
}
