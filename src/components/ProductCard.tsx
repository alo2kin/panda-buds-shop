import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product);
    toast.success(`${product.name} dodat u korpu!`, {
      description: "Nastavi sa kupovinom ili idi na checkout.",
    });
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <div className="group bg-card rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Image Gallery */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={product.images[selectedImage]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Color badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5">
          <span
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: product.colorHex }}
          />
          <span className="text-sm font-medium">{product.color}</span>
        </div>

        {/* Thumbnail navigation */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {product.images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                selectedImage === idx
                  ? "bg-bamboo w-6"
                  : "bg-background/70 hover:bg-background"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-bamboo-dark">
              {product.price.toLocaleString("sr-RS")}
            </span>
            <span className="text-sm text-muted-foreground ml-1">RSD</span>
          </div>

          <Button
            variant="cart"
            size="default"
            onClick={handleAddToCart}
            disabled={isAdding}
            className="min-w-[140px]"
          >
            {isAdding ? (
              <>
                <Check className="h-4 w-4" />
                Dodato!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Dodaj u korpu
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
