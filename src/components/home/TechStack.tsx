import { Container } from "@/components/layout/Container";
import { technologies } from "@/data/technologies";

export function TechStack() {
  return (
    <section className="border-b border-white/10 py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-[240px_1fr]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Tecnologias
          </span>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
            {technologies.map((technology) => (
              <span
                key={technology}
                className="border-b border-white/10 pb-4 text-lg text-neutral-300"
              >
                {technology}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}