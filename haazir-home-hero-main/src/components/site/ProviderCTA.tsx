import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ProviderCTA = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl border border-teal/30 bg-teal-gradient p-10 md:p-14 shadow-teal">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative grid md:grid-cols-[1.5fr_auto] gap-6 items-center">
            <div className="text-secondary-foreground">
              <h2 className="text-3xl md:text-4xl font-bold">
                Earn with Haazir — join 10,000+ pros
              </h2>
              <p className="mt-3 text-secondary-foreground/85 max-w-xl">
                Get steady jobs, fair pay and instant payouts. Set your own hours and grow your customer base.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-gold-gradient text-primary-foreground hover:opacity-90 shadow-gold font-semibold h-12 px-7"
            >
              Apply Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProviderCTA;
