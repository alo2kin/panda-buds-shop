import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartItemComponent } from "@/components/CartItem";
import { CheckoutForm } from "@/components/CheckoutForm";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { SHIPPING_COST } from "@/data/products";

const Cart = () => {
  const { items, totalPrice } = useCart();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazad na prodavnicu
          </Link>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-6">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Korpa je prazna</h2>
              <p className="text-muted-foreground mb-6">
                Dodaj proizvode u korpu da nastaviš sa kupovinom.
              </p>
              <Button variant="accent" size="lg" asChild>
                <Link to="/">Pogledaj proizvode</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Cart Items */}
              <div>
                <h1 className="text-2xl font-bold mb-6">
                  Korpa ({items.length} {items.length === 1 ? "proizvod" : "proizvoda"})
                </h1>

                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemComponent key={item.product.id} item={item} />
                  ))}
                </div>

                {/* Summary for mobile */}
                <div className="lg:hidden mt-6 bg-muted rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Proizvodi</span>
                    <span>{totalPrice.toLocaleString("sr-RS")} RSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Poštarina</span>
                    <span>{SHIPPING_COST.toLocaleString("sr-RS")} RSD</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-bold">
                    <span>Ukupno</span>
                    <span className="text-bamboo-dark">
                      {(totalPrice + SHIPPING_COST).toLocaleString("sr-RS")} RSD
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Podaci za dostavu</h2>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <CheckoutForm />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
