import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";

export function About() {
  return (
    <section className="border-b border-white/10 py-24">
      <Container>
        <SectionTitle
          eyebrow="Sobre"
          title="Software para resolver problemas reais."
          description="Atuação em desenvolvimento de sistemas, automação de processos, arquitetura de aplicações e produtos digitais."
        />
      </Container>
    </section>
  );
}