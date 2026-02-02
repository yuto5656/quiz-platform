import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Quiz Platform. All rights reserved.
        </p>
        <nav className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/terms" className="hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:underline">
            プライバシー
          </Link>
        </nav>
      </div>
    </footer>
  );
}
