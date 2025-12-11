import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const OrderSuccess = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-bamboo-light mb-6 animate-scale-in">
              <CheckCircle2 className="h-12 w-12 text-bamboo-dark" />
            </div>

            <h1 className="text-3xl font-bold mb-4 animate-slide-up">
              Hvala na porudžbini! 🐼
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Vaša porudžbina je uspešno primljena. Uskoro ćete dobiti
              potvrdu na email adresu.
            </p>

            <div className="bg-muted rounded-xl p-6 mb-8 space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-4 text-left">
                <div className="h-12 w-12 rounded-full bg-bamboo-light flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-bamboo-dark" />
                </div>
                <div>
                  <h3 className="font-semibold">Potvrda na email</h3>
                  <p className="text-sm text-muted-foreground">
                    Proverite inbox za potvrdu porudžbine
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left">
                <div className="h-12 w-12 rounded-full bg-bamboo-light flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-bamboo-dark" />
                </div>
                <div>
                  <h3 className="font-semibold">Isporuka 2-5 radnih dana</h3>
                  <p className="text-sm text-muted-foreground">
                    Plaćanje pouzećem prilikom preuzimanja
                  </p>
                </div>
              </div>
            </div>

            <Button variant="accent" size="lg" asChild className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/">Nazad na početnu</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
