import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  productId: string;
  name: string;
  color: string;
  quantity: number;
  price: number;
}

interface OrderRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  municipality: string;
  city: string;
  address: string;
  courierService: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderRequest = await req.json();
    console.log("Received order:", orderData);

    // Create Supabase client with service role for inserting orders
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert order into database
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        first_name: orderData.firstName,
        last_name: orderData.lastName,
        phone: orderData.phone,
        email: orderData.email,
        municipality: orderData.municipality,
        city: orderData.city,
        address: orderData.address,
        courier_service: orderData.courierService,
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        total: orderData.total,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to save order: ${dbError.message}`);
    }

    console.log("Order saved to database:", order.id);

    // Generate items HTML for email
    const itemsHtml = orderData.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              ${item.name} (${item.color})
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
              ${item.quantity}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              ${(item.price * item.quantity).toLocaleString("sr-RS")} RSD
            </td>
          </tr>
        `
      )
      .join("");

    // Send confirmation email to customer using Resend API directly
    const customerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Panda Buds <onboarding@resend.dev>",
        to: [orderData.email],
        subject: "🐼 Hvala na porudžbini - Panda Buds",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #1a1a1a; margin: 0;">🐼 Panda Buds</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, #f0fdf4, #ffffff); border-radius: 16px; padding: 30px; margin: 20px 0;">
              <h2 style="color: #166534; margin-top: 0;">Hvala na porudžbini, ${orderData.firstName}!</h2>
              <p>Vaša porudžbina je uspešno primljena i biće isporučena u roku od 2-5 radnih dana.</p>
              <p style="background: #dcfce7; padding: 12px; border-radius: 8px; text-align: center; font-weight: bold;">
                Broj porudžbine: ${order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div style="background: #f9fafb; border-radius: 16px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📦 Vaša porudžbina</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #e5e7eb;">
                    <th style="padding: 12px; text-align: left;">Proizvod</th>
                    <th style="padding: 12px; text-align: center;">Kom.</th>
                    <th style="padding: 12px; text-align: right;">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right;">Poštarina:</td>
                    <td style="padding: 12px; text-align: right;">${orderData.shipping} RSD</td>
                  </tr>
                  <tr style="font-weight: bold; font-size: 18px;">
                    <td colspan="2" style="padding: 12px; text-align: right;">Ukupno:</td>
                    <td style="padding: 12px; text-align: right; color: #166534;">${orderData.total} RSD</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="background: #f9fafb; border-radius: 16px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📍 Adresa dostave</h3>
              <p style="margin: 0;">
                ${orderData.firstName} ${orderData.lastName}<br>
                ${orderData.address}<br>
                ${orderData.municipality}, ${orderData.city}<br>
                Tel: ${orderData.phone}
              </p>
              <p style="margin-top: 12px; font-weight: bold;">
                🚚 Kurirska služba: ${orderData.courierService}
              </p>
            </div>

            <div style="background: #fef3c7; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-weight: bold;">💵 Plaćanje pouzećem</p>
              <p style="margin: 8px 0 0;">Iznos za plaćanje: ${orderData.total} RSD</p>
            </div>

            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
              <p>Imate pitanja? Kontaktirajte nas na info@panda-buds.com</p>
              <p>© ${new Date().getFullYear()} Panda Buds. Sva prava zadržana.</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const customerEmailData = await customerEmailResponse.json();
    console.log("Customer email sent:", customerEmailData);

    // Send notification email to store owner
    const ownerEmail = Deno.env.get("OWNER_EMAIL") || orderData.email;
    
    const ownerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Panda Buds <onboarding@resend.dev>",
        to: [ownerEmail],
        subject: `🐼 Nova porudžbina #${order.id.slice(0, 8).toUpperCase()} - ${orderData.firstName} ${orderData.lastName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #166534;">🐼 Nova porudžbina!</h1>
            
            <div style="background: #f0fdf4; border-radius: 16px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Porudžbina #${order.id.slice(0, 8).toUpperCase()}</h2>
              <p><strong>Datum:</strong> ${new Date().toISOString()}</p>
            </div>

            <div style="background: #f9fafb; border-radius: 16px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0;">👤 Kupac</h3>
              <p>
                <strong>Ime:</strong> ${orderData.firstName} ${orderData.lastName}<br>
                <strong>Email:</strong> ${orderData.email}<br>
                <strong>Telefon:</strong> ${orderData.phone}<br>
                <strong>Adresa:</strong> ${orderData.address}, ${orderData.municipality}, ${orderData.city}<br>
                <strong>🚚 Kurir:</strong> ${orderData.courierService}
              </p>
            </div>

            <div style="background: #f9fafb; border-radius: 16px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📦 Proizvodi</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #e5e7eb;">
                    <th style="padding: 12px; text-align: left;">Proizvod</th>
                    <th style="padding: 12px; text-align: center;">Kom.</th>
                    <th style="padding: 12px; text-align: right;">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right;">Poštarina:</td>
                    <td style="padding: 12px; text-align: right;">${orderData.shipping} RSD</td>
                  </tr>
                  <tr style="font-weight: bold; font-size: 18px; background: #dcfce7;">
                    <td colspan="2" style="padding: 12px; text-align: right;">UKUPNO:</td>
                    <td style="padding: 12px; text-align: right;">${orderData.total} RSD</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Ovaj email je automatski generisan od strane Panda Buds sistema.
            </p>
          </body>
          </html>
        `,
      }),
    });

    const ownerEmailData = await ownerEmailResponse.json();
    console.log("Owner notification email sent:", ownerEmailData);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        message: "Order created and emails sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-order function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
