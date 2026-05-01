import {
  Zap, Wrench, Leaf, Car, Paintbrush, Snowflake, Sparkles, Hammer, ArrowRight,
} from "lucide-react";

const services = [
  { icon: Zap, name: "Electrician", price: "PKR 800" },
  { icon: Wrench, name: "Plumber", price: "PKR 700" },
  { icon: Leaf, name: "Gardener", price: "PKR 600" },
  { icon: Car, name: "Driver", price: "PKR 1,200" },
  { icon: Paintbrush, name: "Painter", price: "PKR 1,500" },
  { icon: Snowflake, name: "AC Repair", price: "PKR 1,000" },
  { icon: Sparkles, name: "Cleaning", price: "PKR 900" },
  { icon: Hammer, name: "Carpenter", price: "PKR 850" },
];

const Services = () => {
  return (
    <section id="services" className="py-20 md:py-28">
      <div className="container">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal">
            Categories
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">
            Services available on <span className="text-gradient-gold">Haazir</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every pro is background-checked and rated by real customers. Pick a
            service to see live availability in your area.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {services.map(({ icon: Icon, name, price }) => (
            <button
              key={name}
              className="group relative text-left rounded-2xl border border-border bg-card-gradient p-5 transition-smooth hover:border-teal hover:shadow-teal hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="grid place-items-center h-12 w-12 rounded-xl bg-muted text-primary group-hover:bg-gold-gradient group-hover:text-primary-foreground transition-smooth">
                  <Icon className="h-6 w-6" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="mt-5 font-semibold text-foreground">{name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">from {price}</p>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a href="#" className="inline-flex items-center gap-2 text-teal hover:text-teal-glow font-medium">
            View all services <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Services;
