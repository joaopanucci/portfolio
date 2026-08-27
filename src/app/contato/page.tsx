import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Contato"
};

export default function ContactPage() {
  return (
    <Container className="py-24">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        Contato
      </span>

      <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">
        Vamos conversar.
      </h1>

      <div className="mt-12 space-y-5">
        <a
          href="mailto:Joao.panucci@hotmail.com"
          className="block text-xl text-neutral-300 hover:text-white"
        >
          Joao.panucci@hotmail.com
        </a>

        <a
          href="https://github.com/joaopanucci"
          target="_blank"
          rel="noreferrer"
          className="block text-xl text-neutral-300 hover:text-white"
        >
          GitHub
        </a>

        <a
          href="https://www.linkedin.com/in/jaopanucci/"
          target="_blank"
          rel="noreferrer"
          className="block text-xl text-neutral-300 hover:text-white"
        >
          LinkedIn
        </a>
      </div>
    </Container>
  );
}