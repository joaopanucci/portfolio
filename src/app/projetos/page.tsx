import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { projects } from "@/data/projects";

export const metadata = {
  title: "Projetos"
};

export default function ProjectsPage() {
  return (
    <Container className="py-24">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        Portfólio
      </span>

      <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">
        Projetos
      </h1>

      <div className="mt-16">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projetos/${project.slug}`}
            className="group flex items-start justify-between gap-8 border-t border-white/10 py-8"
          >
            <div>
              <h2 className="text-2xl font-medium text-white">
                {project.title}
              </h2>

              <p className="mt-3 max-w-2xl text-neutral-400">
                {project.description}
              </p>
            </div>

            <ArrowUpRight className="h-5 w-5 text-neutral-600 group-hover:text-white" />
          </Link>
        ))}
      </div>
    </Container>
  );
}