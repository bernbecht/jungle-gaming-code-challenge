import { SocialBrandIcon, type SocialBrand } from "@/components/icons/social-brand-icon";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { defaultCatalog } from "@/features/catalog/search";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Segurança da carteira",
    description:
      "Proteja sua carteira e colecione arte digital verificada com confiança.",
  },
  {
    icon: UsersRound,
    title: "Criadores em destaque",
    description:
      "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
  },
  {
    icon: Bell,
    title: "Alertas de lançamentos",
    description:
      "Receba calendários de cunhagem, novidades e análises do mercado.",
  },
] as const;

const footerGroups = [
  {
    title: "Meu perfil",
    links: [
      { label: "Meu perfil", to: "/profile" },
      { label: "Minha coleção" },
      { label: "Atividade" },
      { label: "Estúdio do criador" },
      { label: "Lista de interesse", hash: "newsletter" },
    ],
  },
  {
    title: "Central de ajuda",
    links: [
      { label: "Central de ajuda" },
      { label: "Como comprar NFTs", hash: "collecting-title" },
      { label: "Carteira e segurança", to: "/wallets" },
      { label: "Política do mercado" },
      { label: "Denunciar item" },
    ],
  },
] as const;

const collections = ["Arte digital", "Fotografia", "Generativa"] as const;

function SocialIcons() {
  const socials: SocialBrand[] = [
    "Facebook",
    "Instagram",
    "X",
    "LinkedIn",
    "YouTube",
  ] as const;

  return (
    <div
      className="flex gap-2"
      role="group"
      aria-label="Ícones de redes sociais, sem links disponíveis"
    >
      {socials.map((name) => (
        <span className="site-social-icon" key={name}>
          <SocialBrandIcon brand={name} />
        </span>
      ))}
    </div>
  );
}

function NewsletterSignup() {
  const [message, setMessage] = useState("");

  return (
    <section
      className="site-newsletter"
      id="newsletter"
      aria-labelledby="newsletter-title"
    >
      <h2 id="newsletter-title">Antecipe-se ao próximo lançamento</h2>
      <form
        className="site-newsletter-form"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("Inscrição indisponível nesta demonstração.");
        }}
      >
        <FormField id="newsletter-email" label="Seu e-mail" required className="gap-0" labelClassName="sr-only">
          <Input
            id="newsletter-email"
            type="email"
            placeholder="digite seu e-mail..."
            autoComplete="email"
            required
          />
        </FormField>
        <Button type="submit" size="sm">
          Enviar
        </Button>
      </form>
      <p className="text-xs leading-5 text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do
        mercado.
      </p>
      {message && (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export function SiteFooter({ isHome }: { isHome: boolean }) {
  return (
    <footer
      className={`site-footer page-container ${isHome ? "pb-28 md:pb-8" : "pb-8"} ${isHome ? "" : "hidden md:block"}`}
    >
      <div className="site-footer-feature-band">
        {benefits.map(({ icon: Icon, title, description }) => (
          <section className="site-footer-benefit" key={title}>
            <span className="site-footer-benefit-icon">
              <Icon aria-hidden="true" size={22} />
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </section>
        ))}
        <NewsletterSignup />
      </div>

      <div className="site-footer-contact-band">
        <Link
          to="/"
          search={defaultCatalog}
          aria-label="Kurio — início"
          className="font-bold tracking-[0.14em]"
        >
          KURIO
        </Link>
        <p>Feito para colecionadores, criadores e cultura.</p>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>

      <div className="site-footer-directory">
        {footerGroups.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map((item) => (
                <li key={item.label}>
                  {"to" in item ? (
                    <Link to={item.to}>{item.label}</Link>
                  ) : "hash" in item ? (
                    <Link to="/" search={defaultCatalog} hash={item.hash}>
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section>
          <h2>Coleções</h2>
          <ul>
            {collections.map((category) => (
              <li key={category}>
                <Link
                  to="/"
                  search={{ ...defaultCatalog, category: [category] }}
                  hash="colecoes"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="site-footer-socials">
          <h2>Redes sociais</h2>
          <SocialIcons />
          <h2 className="mt-6">Carteiras compatíveis</h2>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Carteiras compatíveis mostradas no protótipo"
          >
            {["METAMASK", "WALLETCONNECT", "COINBASE"].map((wallet) => (
              <span className="site-wallet-badge" key={wallet}>
                {wallet}
              </span>
            ))}
          </div>
        </section>
      </div>

      <p className="site-footer-copyright">
        © 2026 Kurio. Propriedade digital para todos. Demonstração: nenhuma
        transação real é realizada.
      </p>
    </footer>
  );
}
