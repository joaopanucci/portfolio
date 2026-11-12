import type { Language } from "./i18n";

export type Planet = {
  id: string;
  /** Distance from the Sun in astronomical units. */
  au: number;
  /** Orbital period in Earth years. */
  years: number;
  /** Mean diameter in km. */
  km: number;
  color: [string, string];
  text: Record<Language, { name: string; note: string }>;
};

export const planets: Planet[] = [
  {
    id: "mercury", au: 0.387, years: 0.241, km: 4879, color: ["#d6d3d1", "#78716c"],
    text: {
      pt: { name: "Mercúrio", note: "O menor planeta e o mais próximo do Sol. Quase sem atmosfera, vai de muito quente a muito frio em um único dia." },
      en: { name: "Mercury", note: "The smallest planet and the closest to the Sun. With almost no atmosphere, it swings from scorching to freezing in a single day." },
      es: { name: "Mercurio", note: "El planeta más pequeño y el más cercano al Sol. Casi sin atmósfera, pasa de muy caliente a muy frío en un solo día." },
    },
  },
  {
    id: "venus", au: 0.723, years: 0.615, km: 12104, color: ["#fde68a", "#d97706"],
    text: {
      pt: { name: "Vênus", note: "Envolto em nuvens densas, tem o efeito estufa mais intenso do Sistema Solar — é mais quente que Mercúrio." },
      en: { name: "Venus", note: "Wrapped in thick clouds, it has the strongest greenhouse effect in the Solar System — hotter than Mercury." },
      es: { name: "Venus", note: "Envuelto en nubes densas, tiene el efecto invernadero más intenso del Sistema Solar: es más caliente que Mercurio." },
    },
  },
  {
    id: "earth", au: 1, years: 1, km: 12742, color: ["#7dd3fc", "#16a34a"],
    text: {
      pt: { name: "Terra", note: "O único mundo conhecido com vida. Mais de dois terços da superfície são cobertos por oceanos." },
      en: { name: "Earth", note: "The only known world with life. More than two thirds of its surface is covered by oceans." },
      es: { name: "Tierra", note: "El único mundo conocido con vida. Más de dos tercios de su superficie están cubiertos por océanos." },
    },
  },
  {
    id: "mars", au: 1.524, years: 1.881, km: 6779, color: ["#fca5a5", "#b91c1c"],
    text: {
      pt: { name: "Marte", note: "O planeta vermelho abriga o Monte Olimpo, o maior vulcão conhecido do Sistema Solar." },
      en: { name: "Mars", note: "The red planet is home to Olympus Mons, the largest known volcano in the Solar System." },
      es: { name: "Marte", note: "El planeta rojo alberga el Monte Olimpo, el volcán más grande conocido del Sistema Solar." },
    },
  },
  {
    id: "jupiter", au: 5.203, years: 11.86, km: 139820, color: ["#fdba74", "#9a3412"],
    text: {
      pt: { name: "Júpiter", note: "O maior planeta: caberiam mais de mil Terras dentro dele. A Grande Mancha Vermelha é uma tempestade gigante." },
      en: { name: "Jupiter", note: "The largest planet: over a thousand Earths would fit inside. The Great Red Spot is a giant storm." },
      es: { name: "Júpiter", note: "El planeta más grande: cabrían más de mil Tierras dentro. La Gran Mancha Roja es una tormenta gigante." },
    },
  },
  {
    id: "saturn", au: 9.537, years: 29.46, km: 116460, color: ["#fde68a", "#a16207"],
    text: {
      pt: { name: "Saturno", note: "Famoso pelos anéis de gelo e rocha. Sua densidade média é menor que a da água." },
      en: { name: "Saturn", note: "Famous for its rings of ice and rock. Its average density is lower than that of water." },
      es: { name: "Saturno", note: "Famoso por sus anillos de hielo y roca. Su densidad media es menor que la del agua." },
    },
  },
  {
    id: "uranus", au: 19.19, years: 84.01, km: 50724, color: ["#a5f3fc", "#0e7490"],
    text: {
      pt: { name: "Urano", note: "Gira praticamente deitado, com o eixo inclinado cerca de 98°. Um gigante de gelo azul-esverdeado." },
      en: { name: "Uranus", note: "It spins almost on its side, with its axis tilted about 98°. A blue-green ice giant." },
      es: { name: "Urano", note: "Gira prácticamente de lado, con el eje inclinado unos 98°. Un gigante de hielo azul verdoso." },
    },
  },
  {
    id: "neptune", au: 30.07, years: 164.8, km: 49244, color: ["#93c5fd", "#1d4ed8"],
    text: {
      pt: { name: "Netuno", note: "O planeta mais distante, com os ventos mais rápidos do Sistema Solar. Foi descoberto por cálculos antes de ser visto." },
      en: { name: "Neptune", note: "The farthest planet, with the fastest winds in the Solar System. It was found by calculation before it was seen." },
      es: { name: "Neptuno", note: "El planeta más lejano, con los vientos más rápidos del Sistema Solar. Fue hallado por cálculo antes de ser visto." },
    },
  },
];
