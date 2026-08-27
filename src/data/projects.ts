import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    slug: "saps",
    title: "SAPS",
    description:
      "Sistema para gestão de processos e serviços relacionados à Atenção Primária à Saúde.",
    longDescription:
      "Projeto full stack com frontend e backend separados, autenticação, controle de acesso, módulos administrativos e portais públicos.",
    stack: [
      "Java",
      "Spring Boot",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Docker"
    ],
    status: "Em desenvolvimento"
  },
  {
    slug: "acho",
    title: "Acho",
    description:
      "Plataforma para descoberta geolocalizada de produtos, serviços e estabelecimentos.",
    longDescription:
      "Aplicação voltada à conexão entre usuários e negócios locais, utilizando geolocalização e arquitetura moderna.",
    stack: [
      "Java",
      "Spring Boot",
      "PostgreSQL",
      "React Native",
      "Vue"
    ],
    status: "Em desenvolvimento"
  }
];