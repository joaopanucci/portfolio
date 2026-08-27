import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/Container";

export function Contact() {
  return (
    <section className="py-28">
      <Container>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Contato
        </span>

        <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Tem um projeto, oportunidade ou ideia?
        </h2>

        <a
          href="mailto:Joao.panucci@hotmail.com"
          className="mt-8 inline-flex items-center border-b border-white pb-1 text-lg text-white"
        >
          Joao.panucci@hotmail.com
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </a>
      </Container>
    </section>
  );
}