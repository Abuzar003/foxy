export const dynamic = "force-dynamic";

import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import Services from "@/components/site/Services";
import HowItWorks from "@/components/site/HowItWorks";
import WhyHaazir from "@/components/site/WhyHaazir";
import Testimonials from "@/components/site/Testimonials";
import Support from "@/components/site/Support";
import ProviderCTA from "@/components/site/ProviderCTA";
import Footer from "@/components/site/Footer";

const Home = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <WhyHaazir />
      <Testimonials />
      <Support />
      <ProviderCTA />
      <Footer />
    </main>
  );
};

export default Home;
