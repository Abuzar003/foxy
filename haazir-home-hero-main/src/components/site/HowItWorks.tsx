import { ListChecks, CalendarClock, UserCheck, Smile } from "lucide-react";

const steps = [
  { icon: ListChecks, title: "Choose a service", desc: "Pick what you need from 50+ categories." },
  { icon: CalendarClock, title: "Pick a time", desc: "Book instantly or schedule for later." },
  { icon: UserCheck, title: "Get matched", desc: "A verified pro is assigned in minutes." },
  { icon: Smile, title: "Relax & rate", desc: "Job done, pay securely, leave a review." },
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-20 md:py-28 bg-muted/30 border-y border-border">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal">
            How it works
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">
            From request to relief — in 4 simple steps
          </h2>
        </div>

        <div className="relative mt-14 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="hidden md:block absolute top-7 left-[12%] right-[12%] border-t-2 border-dashed border-teal/40" />
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-gold-gradient text-primary-foreground shadow-gold relative z-10">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="mt-2 text-xs font-bold tracking-widest text-primary">
                STEP {i + 1}
              </div>
              <h3 className="mt-2 font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
