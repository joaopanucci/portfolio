import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Sobre"
};

export default function AboutPage() {
  return (
    <Container className="py-24">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        Sobre
      </span>

      <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white">
        Desenvolvimento, tecnologia e resolução de problemas.
      </h1>

      <div className="mt-10 max-w-3xl space-y-6 text-lg leading-8 text-neutral-400">
        <p>
          Sou João Paulo Panucci Bernardes, desenvolvedor de software com
          atuação em sistemas web, APIs, automação de processos e produtos
          digitais.
        </p>

        <p>
          Trabalho principalmente com Java, Spring Boot, React, TypeScript,
          bancos relacionais e infraestrutura baseada em containers.
        </p>
      </div>
    </Container>
  );
}