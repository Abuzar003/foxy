import Link from "next/link";
import { Car, Home, Package, Users, Shield, ArrowRight } from "lucide-react";

const services = [
  { icon: Car, name: "On-Demand Drivers", blurb: "Trips, functions, emergency travel" },
  { icon: Home, name: "Short-Term Maids / Helpers", blurb: "Maids and helpers — cleaning, shifting" },
  { icon: Package, name: "Delivery / Helper / Loader", blurb: "Lifting, shifting, shop runs" },
  { icon: Users, name: "Event Helpers", blurb: "Waiters, setup, clean-up" },
  {
    icon: Shield,
    name: "Security Guards",
    blurb: "Events, shops, night cover",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 md:py-28">
      <div className="container">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal">Categories</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">
            Services available on <span className="text-gradient-gold">Haazir</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every pro is background-checked and rated by real customers. Start with one of our launch offerings.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
          {services.map(({ icon: Icon, name, blurb }) => (
            <Link
              key={name}
              href="/auth/login"
              className="group relative text-left rounded-2xl border border-border bg-card-gradient p-5 transition-smooth hover:border-teal hover:shadow-teal hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="grid place-items-center h-12 w-12 rounded-xl bg-muted text-primary group-hover:bg-gold-gradient group-hover:text-primary-foreground transition-smooth">
                  <Icon className="h-6 w-6" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="mt-5 font-semibold text-foreground leading-snug">{name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-teal hover:text-teal-glow font-medium">
            View all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;
