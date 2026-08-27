import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="flex min-h-[75vh] items-center border-b border-white/10">
      <Container>
        <div className="max-w-5xl py-24">
          <span className="mb-6 block text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            Software Developer
          </span>

          <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl md:text-7xl lg:text-8xl">
            João Paulo
            <br />
            Panucci Bernardes.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-400">
            Desenvolvo sistemas, APIs e produtos digitais utilizando
            Java, Spring Boot, React e tecnologias modernas.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/projetos">
              Ver projetos
            </Button>

            <Button
              href="https://github.com/joaopanucci"
              variant="secondary"
            >
              GitHub
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}