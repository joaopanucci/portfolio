import Link from "next/link";
import { Container } from "@/components/layout/Container";

export function Header() {
  return (
    <header className="border-b border-white/10">
      <Container>
        <div className="flex h-20 items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-white"
          >
            João Panucci
          </Link>

          <nav className="flex items-center gap-6 text-sm text-neutral-400">
            <Link href="/projetos" className="transition hover:text-white">
              Projetos
            </Link>

            <Link href="/sobre" className="transition hover:text-white">
              Sobre
            </Link>

            <Link href="/contato" className="transition hover:text-white">
              Contato
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}