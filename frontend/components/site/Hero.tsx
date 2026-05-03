import { Star, ShieldCheck, Clock } from "lucide-react";
import { HeroBookBar } from "@/components/site/HeroBookBar";

const Hero = () => {
  return (
    <section id="top" className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-hero overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse-dot" />
            Help is Haazir — available across your city
          </span>

          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Trusted home services, <span className="text-gradient-gold">Haazir</span> at your doorstep.
          </h1>

          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Book electricians, plumbers, gardeners, drivers, painters and more — instantly or whenever you need.
          </p>

          <HeroBookBar />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal" />
              10,000+ verified pros
            </span>
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary fill-primary" />
              4.9 average rating
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal" />
              24/7 support
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
