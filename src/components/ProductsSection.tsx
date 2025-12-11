import { products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

export const ProductsSection = () => {
  return (
    <section id="products" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Izaberi svoj model
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Četiri jedinstvene boje za svaki stil. Sve Panda Buds slušalice
            dolaze sa istim premium kvalitetom zvuka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
