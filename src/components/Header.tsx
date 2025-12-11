import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

export const Header = () => {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🐼</span>
          <span className="text-xl font-bold tracking-tight group-hover:text-bamboo transition-colors">
            Panda Buds
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#products"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Proizvodi
          </a>
          <a
            href="#benefits"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Benefiti
          </a>
          <a
            href="#warranty"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Garancija
          </a>
        </nav>

        <Link to="/cart">
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-bamboo text-accent-foreground text-xs font-bold flex items-center justify-center animate-scale-in">
                {totalItems}
              </span>
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
};
