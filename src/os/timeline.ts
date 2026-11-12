import type { Language } from "./i18n";

export type Era = {
  id: string;
  /** Years before the present. */
  ago: number;
  colors: [string, string];
  text: Record<Language, { when: string; title: string; body: string }>;
};

export const UNIVERSE_AGE = 13.8e9;
const YEAR_SECONDS = 365 * 24 * 3600;

/** Position of an event on the "cosmic calendar" (the universe squeezed into one year). */
export function cosmicDate(ago: number, language: Language) {
  const elapsed = (1 - ago / UNIVERSE_AGE) * YEAR_SECONDS;
  const remaining = YEAR_SECONDS - elapsed;
  const base = new Date(Date.UTC(2025, 0, 1) + Math.min(elapsed, YEAR_SECONDS - 1) * 1000);
  const locale = { pt: "pt-BR", en: "en-US", es: "es-ES" }[language];
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(base);
  let time: string;
  if (remaining < 60) {
    time = `23:59:${(60 - remaining).toFixed(2).padStart(5, "0")}`;
  } else {
    const h = String(base.getUTCHours()).padStart(2, "0");
    const m = String(base.getUTCMinutes()).padStart(2, "0");
    const s = String(base.getUTCSeconds()).padStart(2, "0");
    time = `${h}:${m}:${s}`;
  }
  return { date, time, progress: Math.min(1, Math.max(0, elapsed / YEAR_SECONDS)) };
}

/** How many cosmic-calendar seconds a span of years takes. */
export function cosmicSeconds(years: number) {
  return (years / UNIVERSE_AGE) * YEAR_SECONDS;
}

export const eras: Era[] = [
  {
    id: "big-bang",
    ago: 13.8e9,
    colors: ["#ffffff", "#fbbf24"],
    text: {
      pt: { when: "13,8 bilhões de anos atrás", title: "O Big Bang", body: "Espaço, tempo e energia surgem de um estado extremamente quente e denso. Tudo o que existe hoje começou a se expandir aqui." },
      en: { when: "13.8 billion years ago", title: "The Big Bang", body: "Space, time and energy emerge from an extremely hot, dense state. Everything that exists today began expanding right here." },
      es: { when: "13,8 mil millones de años atrás", title: "El Big Bang", body: "Espacio, tiempo y energía surgen de un estado extremadamente caliente y denso. Todo lo que existe hoy empezó a expandirse aquí." },
    },
  },
  {
    id: "nuclei",
    ago: 13.8e9,
    colors: ["#fde68a", "#f97316"],
    text: {
      pt: { when: "Primeiros minutos", title: "Os primeiros núcleos", body: "Em poucos minutos o universo esfria o bastante para formar hidrogênio e hélio — a matéria-prima de todas as estrelas." },
      en: { when: "First minutes", title: "The first nuclei", body: "Within minutes the universe cools enough to forge hydrogen and helium — the raw material of every star." },
      es: { when: "Primeros minutos", title: "Los primeros núcleos", body: "En pocos minutos el universo se enfría lo suficiente para formar hidrógeno y helio, la materia prima de todas las estrellas." },
    },
  },
  {
    id: "cmb",
    ago: 13.8e9 - 380e3,
    colors: ["#fca5a5", "#c084fc"],
    text: {
      pt: { when: "380 mil anos atrás", title: "A luz se liberta", body: "Átomos neutros se formam e o universo fica transparente. Aquela luz ainda nos alcança hoje como a radiação cósmica de fundo." },
      en: { when: "380 thousand years ago", title: "Light breaks free", body: "Neutral atoms form and the universe turns transparent. That light still reaches us today as the cosmic microwave background." },
      es: { when: "380 mil años atrás", title: "La luz se libera", body: "Se forman átomos neutros y el universo se vuelve transparente. Esa luz aún nos llega hoy como la radiación cósmica de fondo." },
    },
  },
  {
    id: "first-stars",
    ago: 13.6e9,
    colors: ["#93c5fd", "#6366f1"],
    text: {
      pt: { when: "~200 milhões de anos atrás", title: "Amanhecer cósmico", body: "Nuvens de gás colapsam e as primeiras estrelas se acendem, iluminando a escuridão e forjando elementos mais pesados." },
      en: { when: "~200 million years ago", title: "Cosmic dawn", body: "Gas clouds collapse and the first stars ignite, lighting up the dark and forging heavier elements." },
      es: { when: "~200 millones de años atrás", title: "Amanecer cósmico", body: "Las nubes de gas colapsan y se encienden las primeras estrellas, iluminando la oscuridad y forjando elementos más pesados." },
    },
  },
  {
    id: "galaxies",
    ago: 13.4e9,
    colors: ["#a5b4fc", "#8b5cf6"],
    text: {
      pt: { when: "~13,4 bilhões de anos atrás", title: "As primeiras galáxias", body: "Estrelas se reúnem em galáxias. Observatórios modernos já enxergam algumas delas como eram nessa época." },
      en: { when: "~13.4 billion years ago", title: "The first galaxies", body: "Stars gather into galaxies. Modern observatories can already see some of them as they were back then." },
      es: { when: "~13,4 mil millones de años atrás", title: "Las primeras galaxias", body: "Las estrellas se agrupan en galaxias. Los observatorios modernos ya ven algunas tal como eran entonces." },
    },
  },
  {
    id: "sun",
    ago: 4.6e9,
    colors: ["#fde047", "#f97316"],
    text: {
      pt: { when: "4,6 bilhões de anos atrás", title: "O Sol se acende", body: "Uma nuvem de gás e poeira colapsa. No centro nasce o Sol; ao redor, um disco de onde sairão os planetas." },
      en: { when: "4.6 billion years ago", title: "The Sun ignites", body: "A cloud of gas and dust collapses. The Sun is born at the center, with a disk around it that will become the planets." },
      es: { when: "4,6 mil millones de años atrás", title: "El Sol se enciende", body: "Una nube de gas y polvo colapsa. En el centro nace el Sol; alrededor, un disco del que saldrán los planetas." },
    },
  },
  {
    id: "earth",
    ago: 4.54e9,
    colors: ["#38bdf8", "#22c55e"],
    text: {
      pt: { when: "4,54 bilhões de anos atrás", title: "A Terra e a Lua", body: "Um planeta rochoso se forma na distância certa do Sol. Pouco depois, um impacto gigante dá origem à Lua." },
      en: { when: "4.54 billion years ago", title: "Earth and the Moon", body: "A rocky planet takes shape at just the right distance from the Sun. Soon after, a giant impact creates the Moon." },
      es: { when: "4,54 mil millones de años atrás", title: "La Tierra y la Luna", body: "Un planeta rocoso se forma a la distancia justa del Sol. Poco después, un impacto gigante origina la Luna." },
    },
  },
  {
    id: "life",
    ago: 3.7e9,
    colors: ["#4ade80", "#14b8a6"],
    text: {
      pt: { when: "~3,7 bilhões de anos atrás", title: "A vida", body: "Surgem os primeiros micro-organismos. As evidências mais antigas apontam para algo entre 3,5 e 3,8 bilhões de anos." },
      en: { when: "~3.7 billion years ago", title: "Life", body: "The first microorganisms appear. The oldest evidence points to somewhere between 3.5 and 3.8 billion years ago." },
      es: { when: "~3,7 mil millones de años atrás", title: "La vida", body: "Aparecen los primeros microorganismos. Las evidencias más antiguas apuntan a entre 3,5 y 3,8 mil millones de años." },
    },
  },
  {
    id: "cambrian",
    ago: 541e6,
    colors: ["#2dd4bf", "#3b82f6"],
    text: {
      pt: { when: "541 milhões de anos atrás", title: "Explosão cambriana", body: "Em poucos milhões de anos a vida animal se diversifica: olhos, conchas, esqueletos e quase todos os grandes grupos atuais." },
      en: { when: "541 million years ago", title: "Cambrian explosion", body: "Within a few million years animal life diversifies: eyes, shells, skeletons and nearly all major modern groups." },
      es: { when: "541 millones de años atrás", title: "Explosión cámbrica", body: "En pocos millones de años la vida animal se diversifica: ojos, conchas, esqueletos y casi todos los grandes grupos actuales." },
    },
  },
  {
    id: "dinosaurs",
    ago: 230e6,
    colors: ["#a3e635", "#65a30d"],
    text: {
      pt: { when: "230 milhões de anos atrás", title: "Era dos dinossauros", body: "Os dinossauros dominam a Terra por mais de 160 milhões de anos, até o impacto de um asteroide, há cerca de 66 milhões de anos." },
      en: { when: "230 million years ago", title: "Age of dinosaurs", body: "Dinosaurs rule the Earth for over 160 million years, until an asteroid impact about 66 million years ago." },
      es: { when: "230 millones de años atrás", title: "Era de los dinosaurios", body: "Los dinosaurios dominan la Tierra durante más de 160 millones de años, hasta el impacto de un asteroide hace unos 66 millones." },
    },
  },
  {
    id: "humans",
    ago: 300e3,
    colors: ["#fdba74", "#ef4444"],
    text: {
      pt: { when: "~300 mil anos atrás", title: "Homo sapiens", body: "Uma espécie curiosa olha para o céu e começa a perguntar de onde veio tudo isso." },
      en: { when: "~300 thousand years ago", title: "Homo sapiens", body: "A curious species looks up at the sky and starts asking where it all came from." },
      es: { when: "~300 mil años atrás", title: "Homo sapiens", body: "Una especie curiosa mira al cielo y empieza a preguntarse de dónde viene todo esto." },
    },
  },
  {
    id: "writing",
    ago: 5e3,
    colors: ["#fcd34d", "#d97706"],
    text: {
      pt: { when: "~5 mil anos atrás", title: "Escrita e civilizações", body: "O conhecimento passa a ser registrado. Surgem cidades, matemática e os primeiros mapas das estrelas." },
      en: { when: "~5 thousand years ago", title: "Writing and civilizations", body: "Knowledge starts being recorded. Cities, mathematics and the first star charts appear." },
      es: { when: "~5 mil años atrás", title: "Escritura y civilizaciones", body: "El conocimiento empieza a registrarse. Surgen ciudades, matemáticas y los primeros mapas estelares." },
    },
  },
  {
    id: "computers",
    ago: 80,
    colors: ["#67e8f9", "#3b82f6"],
    text: {
      pt: { when: "~80 anos atrás", title: "Os computadores", body: "Máquinas programáveis nascem na década de 1940. Pela primeira vez, ideias viram software." },
      en: { when: "~80 years ago", title: "Computers", body: "Programmable machines are born in the 1940s. For the first time, ideas become software." },
      es: { when: "~80 años atrás", title: "Los computadores", body: "Las máquinas programables nacen en la década de 1940. Por primera vez, las ideas se vuelven software." },
    },
  },
  {
    id: "java",
    ago: 31,
    colors: ["#fb923c", "#dc2626"],
    text: {
      pt: { when: "1995", title: "Nasce o Java", body: "“Escreva uma vez, execute em qualquer lugar.” Uma linguagem que sustenta sistemas, jogos e serviços até hoje." },
      en: { when: "1995", title: "Java is born", body: "“Write once, run anywhere.” A language that still powers systems, games and services today." },
      es: { when: "1995", title: "Nace Java", body: "“Escribe una vez, ejecuta en cualquier lugar.” Un lenguaje que aún sostiene sistemas, juegos y servicios." },
    },
  },
  {
    id: "now",
    ago: 0,
    colors: ["#ffffff", "#67e8f9"],
    text: {
      pt: { when: "Agora", title: "João começa a construir o seu universo", body: "Entre Java, interfaces e ideias, nascem projetos que ligam pessoas, dados e serviços. Esta é a última fração de segundo do calendário cósmico — e ela está só começando." },
      en: { when: "Now", title: "João starts building his own universe", body: "Between Java, interfaces and ideas, projects are born that connect people, data and services. This is the last fraction of a second on the cosmic calendar — and it is just getting started." },
      es: { when: "Ahora", title: "João empieza a construir su universo", body: "Entre Java, interfaces e ideas nacen proyectos que conectan personas, datos y servicios. Es la última fracción de segundo del calendario cósmico, y apenas comienza." },
    },
  },
];
