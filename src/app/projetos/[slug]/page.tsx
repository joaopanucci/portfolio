import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { projects } from "@/data/projects";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug
  }));
}

export default async function ProjectPage({
  params
}: ProjectPageProps) {
  const { slug } = await params;

  const project = projects.find(
    (item) => item.slug === slug
  );

  if (!project) {
    notFound();
  }

  return (
    <Container className="py-24">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        Projeto
      </span>

      <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
        {project.title}
      </h1>

      <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
        {project.longDescription}
      </p>

      <div className="mt-12 grid gap-8 border-y border-white/10 py-8 md:grid-cols-2">
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-600">
            Status
          </span>

          <p className="mt-2 text-neutral-300">
            {project.status}
          </p>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-600">
            Stack
          </span>

          <div className="mt-3 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <span
                key={item}
                className="border border-white/10 px-3 py-1 text-sm text-neutral-400"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}