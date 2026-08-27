import { Container } from "@/components/layout/Container";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <Container>
        <div className="flex flex-col justify-between gap-3 text-sm text-neutral-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} João Panucci
          </span>

          <span>
            joaopanucci.com
          </span>
        </div>
      </Container>
    </footer>
  );
}