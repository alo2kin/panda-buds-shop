import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/context/CartContext";
import { SHIPPING_COST } from "@/data/products";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const COURIER_SERVICES = [
  { id: "Dexpress", name: "D Express" },
  { id: "BexExpress", name: "Bex Express" },
  { id: "AksExpress", name: "Aks Express" },
  { id: "PostExpress", name: "Post Express" },
] as const;

const orderSchema = z.object({
  firstName: z.string().min(2, "Ime mora imati najmanje 2 karaktera").max(50),
  lastName: z.string().min(2, "Prezime mora imati najmanje 2 karaktera").max(50),
  phone: z.string().min(9, "Unesite validan broj telefona").max(20),
  municipality: z.string().min(2, "Unesite opštinu").max(100),
  city: z.string().min(2, "Unesite grad").max(100),
  address: z.string().min(5, "Unesite punu adresu").max(200),
  email: z.string().email("Unesite validnu email adresu").max(100),
  courierService: z.string().min(1, "Izaberite kurirsku službu"),
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      courierService: "Dexpress",
    },
  });

  const selectedCourier = watch("courierService");

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);

    try {
      // Get honeypot value (should be empty for real users)
      const honeypotInput = document.getElementById('website') as HTMLInputElement;
      const honeypotValue = honeypotInput?.value || '';

      const orderData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        municipality: data.municipality,
        city: data.city,
        address: data.address,
        courierService: data.courierService,
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
        website: honeypotValue, // Honeypot field
      };

      const { data: result, error } = await supabase.functions.invoke("create-order", {
        body: orderData,
      });

      if (error) {
        console.error("Order error:", error);
        throw new Error(error.message || "Greška pri slanju porudžbine");
      }

      if (!result.success) {
        throw new Error(result.error || "Greška pri slanju porudžbine");
      }

      console.log("Order created successfully:", result);
      
      setIsSuccess(true);
      toast.success("Porudžbina uspešno poslata!", {
        description: "Potvrda je poslata na vašu email adresu.",
      });

      setTimeout(() => {
        clearCart();
        navigate("/order-success");
      }, 2000);
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast.error("Greška pri slanju porudžbine", {
        description: error.message || "Molimo pokušajte ponovo.",
      });
      setIsSubmitting(false);
    }
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
      {/* Honeypot field - hidden from users, bots will fill it */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

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

      {/* Courier Service Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Izaberite kurirsku službu *
        </Label>
        <RadioGroup
          value={selectedCourier}
          onValueChange={(value) => setValue("courierService", value)}
          className="grid grid-cols-2 gap-3"
        >
          {COURIER_SERVICES.map((courier) => (
            <div key={courier.id}>
              <RadioGroupItem
                value={courier.id}
                id={courier.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={courier.id}
                className="flex items-center justify-center rounded-xl border-2 border-border bg-background p-4 hover:bg-muted cursor-pointer peer-data-[state=checked]:border-bamboo-dark peer-data-[state=checked]:bg-bamboo-light transition-all"
              >
                <span className="font-medium">{courier.name}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.courierService && (
          <p className="text-sm text-destructive">{errors.courierService.message}</p>
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
