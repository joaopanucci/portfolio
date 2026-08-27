import { Container } from "@/components/layout/Container";
import { experience } from "@/data/experience";

export function Experience() {
  return (
    <section className="border-b border-white/10 py-24">
      <Container>
        <div className="grid gap-12 md:grid-cols-[240px_1fr]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Experiência
          </span>

          <div>
            {experience.map((item) => (
              <div
                key={item.company}
                className="border-t border-white/10 py-7"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <h3 className="text-xl font-medium text-white">
                      {item.company}
                    </h3>

                    <p className="mt-2 text-neutral-400">
                      {item.role}
                    </p>
                  </div>

                  <span className="text-sm text-neutral-600">
                    {item.period}
                  </span>
                </div>

                <p className="mt-5 max-w-2xl leading-7 text-neutral-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}