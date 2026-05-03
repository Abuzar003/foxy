"use client";

import { Phone, MessageCircle, Mail, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const channels = [
  {
    icon: Phone,
    title: "Call Us",
    value: "+91 80 4747 0101",
    note: "Avg pickup < 30 seconds",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    value: "Chat with an agent",
    note: "Typical reply < 1 min",
  },
  {
    icon: Mail,
    title: "Email",
    value: "support@haazir.com",
    note: "Reply within 2 hours",
  },
  {
    icon: HelpCircle,
    title: "FAQs",
    value: "Help center",
    note: "Browse common questions",
  },
];

const faqs = [
  {
    q: "How do I book a service on Haazir?",
    a: "Search the service you need, enter your city, pick instant or scheduled, and confirm. A verified pro is matched within minutes.",
  },
  {
    q: "Are the professionals verified?",
    a: "Yes. Every Haazir pro passes ID verification, background checks and skill assessments before accepting jobs.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We support cash on completion, UPI, net banking, RuPay, and all major debit and credit cards — all secured end-to-end.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Free cancellation up to 30 minutes before the scheduled time. Late cancellations may carry a small fee.",
  },
  {
    q: "Which cities does Haazir cover?",
    a: "We're live in Mumbai, Delhi NCR, Bengaluru, Hyderabad, Pune, and Chennai — with new cities being added every month.",
  },
];

const Support = () => {
  return (
    <section id="support" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-gradient text-primary-foreground px-4 py-1.5 text-xs font-bold tracking-wide shadow-gold">
            <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse-dot" />
            24/7 AVAILABLE
          </span>
          <h2 className="mt-5 text-3xl md:text-4xl font-bold">We&apos;re here, day or night</h2>
          <p className="mt-4 text-muted-foreground">
            Pick the channel that suits you — our support team is Haazir whenever you need.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {channels.map((c) => (
            <a
              key={c.title}
              href="#"
              className="group rounded-2xl border border-border bg-card-gradient p-6 transition-smooth hover:border-primary hover:shadow-gold hover:-translate-y-1"
            >
              <div className="grid place-items-center h-12 w-12 rounded-xl bg-muted text-teal group-hover:bg-teal-gradient group-hover:text-secondary-foreground transition-smooth">
                <c.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-semibold">{c.title}</h3>
              <p className="mt-1 text-foreground font-medium">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
            </a>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center">Frequently asked questions</h3>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl mb-3 px-5 bg-card-gradient">
                <AccordionTrigger className="text-left hover:no-underline hover:text-primary">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default Support;
