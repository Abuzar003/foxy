import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ayesha K.",
    city: "Lahore",
    quote:
      "Booked an electrician at 9pm and he was at my door by 9:45. Professional, polite and the price was exactly what the app showed.",
  },
  {
    name: "Bilal R.",
    city: "Karachi",
    quote: "Haazir's painter team transformed my apartment in two days. The scheduling and follow-up were flawless.",
  },
  {
    name: "Sana M.",
    city: "Islamabad",
    quote: "I use Haazir every month for cleaning. Same trusted pro, easy reschedule, secure payments. 10/10.",
  },
];

const initials = (n: string) =>
  n
    .split(" ")
    .map((p) => p[0])
    .join("");

const Testimonials = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal">Testimonials</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">Loved by thousands of homes</h2>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-card-gradient p-7 transition-smooth hover:border-teal hover:-translate-y-1 hover:shadow-teal"
            >
              <div className="flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary" />
                ))}
              </div>
              <blockquote className="mt-4 text-foreground/90 leading-relaxed">&quot;{t.quote}&quot;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid place-items-center h-10 w-10 rounded-full bg-teal-gradient text-secondary-foreground font-semibold">
                  {initials(t.name)}
                </span>
                <span>
                  <span className="block font-semibold">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.city}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
