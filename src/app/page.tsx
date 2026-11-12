import { JoaoOS } from "@/os/JoaoOS";

export default function Home() {
  return (
    <>
      <JoaoOS />
      {/* Crawler- and screen-reader-friendly summary of the interactive portfolio. */}
      <section className="sr-only">
        <h1>João Panucci — Software Developer</h1>
        <p>
          Desenvolvedor de software com foco em Java, Spring Boot, React e soluções digitais. Projetos: Nyron Engine,
          AutoDock, Dakiali, JELCH Group, SAPS. Inclui um jogo de xadrez para desafiar o João no navegador.
        </p>
        <ul>
          <li><a href="https://github.com/joaopanucci">GitHub</a></li>
          <li><a href="https://www.linkedin.com/in/jaopanucci/">LinkedIn</a></li>
        </ul>
      </section>
    </>
  );
}
