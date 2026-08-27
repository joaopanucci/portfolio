import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { projects } from "@/data/projects";

export function Projects() {
  return (
    <section className="border-b border-white/10 py-24">
      <Container>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Projetos selecionados
        </span>

        <div className="mt-12">
          {projects.map((project, index) => (
            <Link
              key={project.slug}
              href={`/projetos/${project.slug}`}
              className="group grid gap-6 border-t border-white/10 py-9 md:grid-cols-[80px_1fr_auto]"
            >
              <span className="font-mono text-sm text-neutral-600">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <h3 className="text-2xl font-medium text-white">
                  {project.title}
                </h3>

                <p className="mt-3 max-w-2xl leading-7 text-neutral-400">
                  {project.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {project.stack.slice(0, 5).map((item) => (
                    <span
                      key={item}
                      className="border border-white/10 px-3 py-1 text-xs text-neutral-500"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <ArrowUpRight className="h-5 w-5 text-neutral-600 transition group-hover:text-white" />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}