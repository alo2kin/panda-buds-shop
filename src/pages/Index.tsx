import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductsSection } from "@/components/ProductsSection";
import { Benefits } from "@/components/Benefits";
import { Warranty } from "@/components/Warranty";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProductsSection />
        <Benefits />
        <Warranty />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
