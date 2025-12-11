import { Shield, CheckCircle2, Truck, CreditCard } from "lucide-react";
import { SHIPPING_COST, WARRANTY_YEARS } from "@/data/products";

export const Warranty = () => {
  return (
    <section id="warranty" className="py-20 bg-gradient-to-br from-primary to-panda-black text-primary-foreground">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-bamboo mb-6">
            <Shield className="h-10 w-10 text-accent-foreground" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {WARRANTY_YEARS} godine garancije
          </h2>
          <p className="text-lg opacity-90 mb-12 max-w-2xl mx-auto">
            Svaki par Panda Buds slušalica dolazi sa punom garancijom od{" "}
            {WARRANTY_YEARS} godine. Kupuj sa potpunim poverenjem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-4 text-bamboo" />
              <h3 className="font-semibold text-lg mb-2">Originalni proizvod</h3>
              <p className="text-sm opacity-80">
                100% originalan proizvod sa svom pratećom dokumentacijom.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
              <Truck className="h-8 w-8 mx-auto mb-4 text-bamboo" />
              <h3 className="font-semibold text-lg mb-2">Brza dostava</h3>
              <p className="text-sm opacity-80">
                Dostava na adresu za samo {SHIPPING_COST} RSD. Isporuka 2-5 radnih dana.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
              <CreditCard className="h-8 w-8 mx-auto mb-4 text-bamboo" />
              <h3 className="font-semibold text-lg mb-2">Plaćanje pouzećem</h3>
              <p className="text-sm opacity-80">
                Plati tek kada preuzmeš paket. Bez rizika, bez brige.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
