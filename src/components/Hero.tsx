import { Button } from "@/components/ui/button";
import { Headphones, Shield, Zap } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-bamboo-light/30 to-background py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-bamboo/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-bamboo/10 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-in">
            <span className="inline-block mb-4 px-4 py-2 bg-bamboo-light text-bamboo-dark rounded-full text-sm font-semibold">
              🐼 Novo u ponudi
            </span>
          </div>

          <h1 className="animate-slide-up text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Slušaj muziku sa stilom.
            <span className="block text-bamboo mt-2">Panda Buds.</span>
          </h1>

          <p className="animate-slide-up text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" style={{ animationDelay: "0.1s" }}>
            Bežične slušalice sa jedinstvenim panda dizajnom. 
            Kristalno čist zvuk, udobnost i stil u jednom paketu.
          </p>

          <div className="animate-slide-up flex flex-col sm:flex-row gap-4 justify-center mb-12" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#products">Pogledaj modele</a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#benefits">Saznaj više</a>
            </Button>
          </div>

          {/* Quick benefits */}
          <div className="animate-slide-up grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="h-12 w-12 rounded-full bg-bamboo-light flex items-center justify-center">
                <Headphones className="h-6 w-6 text-bamboo-dark" />
              </div>
              <span className="font-semibold">Premium zvuk</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="h-12 w-12 rounded-full bg-bamboo-light flex items-center justify-center">
                <Shield className="h-6 w-6 text-bamboo-dark" />
              </div>
              <span className="font-semibold">2 godine garancije</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="h-12 w-12 rounded-full bg-bamboo-light flex items-center justify-center">
                <Zap className="h-6 w-6 text-bamboo-dark" />
              </div>
              <span className="font-semibold">Brza dostava</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
