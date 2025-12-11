import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/CartContext";
import { SHIPPING_COST } from "@/data/products";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";

const orderSchema = z.object({
  firstName: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  lastName: z.string().min(2, "Prezime mora imati najmanje 2 karaktera"),
  phone: z.string().min(9, "Unesite validan broj telefona"),
  municipality: z.string().min(2, "Unesite opštinu"),
  city: z.string().min(2, "Unesite grad"),
  address: z.string().min(5, "Unesite punu adresu"),
  email: z.string().email("Unesite validnu email adresu"),
});

type OrderFormData = z.infer<typeof orderSchema>;

export const CheckoutForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);

    // Simulate order submission - replace with actual backend call
    const orderData = {
      customer: data,
      items: items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        color: item.product.color,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal: totalPrice,
      shipping: SHIPPING_COST,
      total: totalPrice + SHIPPING_COST,
      paymentMethod: "Plaćanje pouzećem",
      createdAt: new Date().toISOString(),
    };

    console.log("Order submitted:", orderData);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);
    
    toast.success("Porudžbina uspešno poslata!", {
      description: "Uskoro ćete dobiti potvrdu na email.",
    });

    // Clear cart after successful order
    setTimeout(() => {
      clearCart();
      navigate("/order-success");
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-bamboo-light mb-4">
          <CheckCircle2 className="h-8 w-8 text-bamboo-dark" />
        </div>
        <h3 className="text-xl font-bold mb-2">Porudžbina uspešna!</h3>
        <p className="text-muted-foreground">Preusmeravamo vas...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Ime *</Label>
          <Input
            id="firstName"
            placeholder="Vaše ime"
            {...register("firstName")}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Prezime *</Label>
          <Input
            id="lastName"
            placeholder="Vaše prezime"
            {...register("lastName")}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Broj telefona *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+381 6X XXX XXXX"
          {...register("phone")}
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email adresa *</Label>
        <Input
          id="email"
          type="email"
          placeholder="vasa@email.com"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="municipality">Opština *</Label>
          <Input
            id="municipality"
            placeholder="Vaša opština"
            {...register("municipality")}
            className={errors.municipality ? "border-destructive" : ""}
          />
          {errors.municipality && (
            <p className="text-sm text-destructive">{errors.municipality.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Grad *</Label>
          <Input
            id="city"
            placeholder="Vaš grad"
            {...register("city")}
            className={errors.city ? "border-destructive" : ""}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresa *</Label>
        <Input
          id="address"
          placeholder="Ulica i broj"
          {...register("address")}
          className={errors.address ? "border-destructive" : ""}
        />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-muted rounded-xl p-4 space-y-3">
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

      {/* Payment method info */}
      <div className="bg-bamboo-light rounded-xl p-4 text-center">
        <p className="text-sm font-medium text-bamboo-dark">
          💵 Plaćanje pouzećem - platite prilikom preuzimanja paketa
        </p>
      </div>

      <Button
        type="submit"
        variant="accent"
        size="xl"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Šaljem porudžbinu...
          </>
        ) : (
          "Potvrdi porudžbinu"
        )}
      </Button>
    </form>
  );
};
