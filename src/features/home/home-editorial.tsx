import { defaultCatalog } from "@/features/catalog/search";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const stories = [
  {
    image: "emerald",
    alt: "Arte digital em tons escuros",
    date: "12 de setembro",
    dateTime: "2026-09-12",
    readingTime: "Leitura de 6 min",
    title: "Como funciona a propriedade de NFTs",
    summary: "Aprenda a colecionar, negociar e verificar ativos digitais.",
  },
  {
    image: "golden",
    alt: "Arte digital em tons dourados",
    date: "13 de setembro",
    dateTime: "2026-09-13",
    readingTime: "Leitura de 2 min",
    title: "10 artistas digitais para acompanhar",
    summary: "Conheça criadores que moldam a cultura digital.",
  },
  {
    image: "violet",
    alt: "Arte digital em tons violetas",
    date: "15 de setembro",
    dateTime: "2026-09-15",
    readingTime: "Leitura de 3 min",
    title: "Raridade, atributos e procedência",
    summary: "Entenda raridade, procedência, direitos autorais e utilidade.",
  },
  {
    image: "ivory",
    alt: "Arte digital em tons claros",
    date: "15 de setembro",
    dateTime: "2026-09-15",
    readingTime: "Leitura de 2 min",
    title: "Como proteger sua carteira",
    summary: "Proteja sua carteira, seus ativos e sua identidade.",
  },
] as const;

export function HomeEditorial() {
  return (
    <div className="home-editorial">
      <section aria-label="Destaques da Kurio" className="home-promos">
        <article className="home-promo-card">
          <img
            src="/assets/placeholders/emerald.svg"
            alt="Arte digital de uma coleção em edição limitada"
            width={320}
            height={280}
          />
          <div className="home-promo-copy">
            <h2>Lançamentos gênesis de edição limitada</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Colecione edições escassas diretamente dos criadores antes da
              revelação pública.
            </p>
            <Link
              to="/"
              search={{ ...defaultCatalog, tab: "new", sort: "recent" }}
              hash="colecoes"
              className="home-text-link"
            >
              Explorar <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </article>
        <article className="home-promo-card">
          <img
            src="/assets/placeholders/ivory.svg"
            alt="Retrato ilustrado de um colecionador"
            width={320}
            height={280}
          />
          <div className="home-promo-copy">
            <h2>Arte digital selecionada e muito mais</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Explore novos artistas, coleções verificadas e obras digitais que
              definem a cultura.
            </p>
            <Link
              to="/"
              search={{ ...defaultCatalog, tab: "trending" }}
              hash="colecoes"
              className="home-text-link"
            >
              Explorar <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </article>
      </section>

      <section
        id="collecting-title"
        aria-labelledby="mint-journal-title"
        className="home-journal"
      >
        <header className="home-journal-heading">
          <h2 id="mint-journal-title">Diário da Cunhagem</h2>
          <p>
            Histórias, guias e insights para colecionadores sobre o universo da
            propriedade digital.
          </p>
        </header>
        <div className="home-story-grid">
          {stories.map((story) => (
            <article className="home-story-card" key={story.title}>
              <img
                src={`/assets/placeholders/${story.image}.svg`}
                alt={story.alt}
                width={320}
                height={240}
                loading="lazy"
              />
              <div className="home-story-copy">
                <p className="home-story-meta">
                  <time dateTime={story.dateTime}>{story.date}</time>
                  <span aria-hidden="true">|</span>
                  <span>{story.readingTime}</span>
                </p>
                <h3>{story.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {story.summary}
                </p>
                <span className="home-story-more" aria-hidden="true">
                  Ler mais <ArrowRight aria-hidden="true" size={14} />
                </span>
                <span className="sr-only">
                  Artigo demonstrativo; o conteúdo não está disponível.
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
