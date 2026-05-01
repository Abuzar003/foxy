import { ShieldCheck, BadgeDollarSign, Zap } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Pros",
    desc: "Every professional is background-checked, skill-tested and continuously rated by customers.",
  },
  {
    icon: BadgeDollarSign,
    title: "Upfront Pricing",
    desc: "See the price before you book. No hidden charges, no last-minute surprises.",
  },
  {
    icon: Zap,
    title: "Instant Availability",
    desc: "Need help right now? Match with an available pro in minutes — or schedule for later.",
  },
];

const WhyHaazir = () => {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal">
            Why Haazir
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">
            Built on trust. Designed for speed.
          </h2>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card-gradient p-8 transition-smooth hover:border-primary/50 hover:shadow-gold"
            >
              <div className="grid place-items-center h-12 w-12 rounded-xl bg-gold-gradient text-primary-foreground shadow-gold">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyHaazir;
