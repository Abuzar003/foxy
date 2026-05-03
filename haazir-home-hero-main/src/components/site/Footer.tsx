import { Sparkles, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const cols = [
  {
    title: "Company",
    links: ["About Haazir", "Careers", "Press", "Contact"],
  },
  {
    title: "Services",
    links: [
      "On-Demand Drivers",
      "Short-Term Maids / Helpers",
      "Delivery / Helper / Loader",
      "Event Helpers",
      "Security Guards",
      "All services",
    ],
  },
  {
    title: "Support",
    links: ["Help Center", "Safety", "Cancellation", "Trust & Quality"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy", "Cookies", "Provider Agreement"],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-16">
        <div className="grid lg:grid-cols-[1.4fr_2fr] gap-12">
          <div>
            <a href="#top" className="flex items-center gap-2">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-gold-gradient shadow-gold">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="text-xl font-bold text-gradient-gold">Haazir</span>
            </a>
            <p className="mt-4 text-muted-foreground max-w-sm">
              On-demand home services from verified pros — instantly or whenever you schedule it.
            </p>

            <form className="mt-6 flex gap-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="your@email.com"
                className="h-11 bg-muted/60 border-border"
              />
              <Button className="h-11 bg-gold-gradient text-primary-foreground hover:opacity-90 font-semibold">
                Subscribe
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid place-items-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-smooth"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {cols.map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-foreground">{col.title}</h4>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-border flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
          <p>© 2026 Haazir. All rights reserved.</p>
          <p>Help is Haazir — Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
