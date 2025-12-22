import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------------------------------------------
// 👇👇👇 OVDE UPIŠI SVOJ EMAIL NA KOJI STIŽU PORUDŽBINE 👇👇👇
const OWNER_EMAIL = "pandabuds@pokloni.com"; 
// --------------------------------------------------------

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
  website?: string; // Honeypot
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIP);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  record.count++;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  return false;
}

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\+\-\(\)]{6,20}$/;
  return phoneRegex.test(phone);
}

function validateString(str: string, minLen: number, maxLen: number): boolean {
  return typeof str === 'string' && str.trim().length >= minLen && str.length <= maxLen;
}

function validateOrderItems(items: OrderItem[]): boolean {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return false;
  }
  return items.every(item => 
    validateString(item.productId, 1, 100) &&
    validateString(item.name, 1, 200) &&
    validateString(item.color, 1, 50) &&
    typeof item.quantity === 'number' && item.quantity > 0 && item.quantity <= 100 &&
    typeof item.price === 'number' && item.price > 0 && item.price <= 1000000
  );
}

function validateOrderData(data: OrderRequest): { valid: boolean; error?: string } {
  if (data.website && data.website.trim() !== '') {
    return { valid: false, error: 'Invalid request' };
  }
  if (!validateString(data.firstName, 1, 100)) return { valid: false, error: 'Invalid first name' };
  if (!validateString(data.lastName, 1, 100)) return { valid: false, error: 'Invalid last name' };
  if (!validatePhone(data.phone)) return { valid: false, error: 'Invalid phone number' };
  if (!validateEmail(data.email)) return { valid: false, error: 'Invalid email address' };
  if (!validateString(data.municipality, 1, 100)) return { valid: false, error: 'Invalid municipality' };
  if (!validateString(data.city, 1, 100)) return { valid: false, error: 'Invalid city' };
  if (!validateString(data.address, 1, 300)) return { valid: false, error: 'Invalid address' };
  if (!validateString(data.courierService, 1, 50)) return { valid: false, error: 'Invalid courier service' };
  if (!validateOrderItems(data.items)) return { valid: false, error: 'Invalid order items' };
  if (typeof data.subtotal !== 'number' || data.subtotal <= 0) return { valid: false, error: 'Invalid subtotal' };
  if (typeof data.shipping !== 'number') return { valid: false, error: 'Invalid shipping cost' };
  if (typeof data.total !== 'number' || data.total <= 0) return { valid: false, error: 'Invalid total' };
  
  if (Math.abs(data.total - (data.subtotal + data.shipping)) > 1) {
    return { valid: false, error: 'Total does not match subtotal + shipping' };
  }
  return { valid: true };
}

// HTML escape helper
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 'unknown';
    
    if (isRateLimited(clientIP)) {
      return new Response(JSON.stringify({ success: false, error: 'Previše zahteva. Sačekajte minut.' }), {
        status: 429, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const orderData: OrderRequest = await req.json();
    const validation = validateOrderData(orderData);
    
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, error: validation.error }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Database insertion
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        first_name: orderData.firstName.trim(),
        last_name: orderData.lastName.trim(),
        phone: orderData.phone.trim(),
        email: orderData.email.trim().toLowerCase(),
        municipality: orderData.municipality.trim(),
        city: orderData.city.trim(),
        address: orderData.address.trim(),
        courier_service: orderData.courierService.trim(),
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        total: orderData.total,
      })
      .select()
      .single();

    if (dbError) throw new Error(`Failed to save order: ${dbError.message}`);

    console.log("Order saved to database:", order.id);

    // Generate Items HTML
    const itemsHtml = orderData.items.map((item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.name)} (${escapeHtml(item.color)})</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${(item.price * item.quantity).toLocaleString("sr-RS")} RSD</td>
      </tr>
    `).join("");

    // 1. Send Email to CUSTOMER
    const customerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Panda Buds <porudzbine@pandabuds.rs>",
        to: [orderData.email],
        subject: "🐼 Hvala na porudžbini - Panda Buds",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #1a1a1a; margin: 0;">🐼 Panda Buds</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, #f0fdf4, #ffffff); border-radius: 16px; padding: 30px; margin: 20px 0;">
              <h2 style="color: #166534; margin-top: 0;">Hvala na porudžbini, ${escapeHtml(orderData.firstName)}!</h2>
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
                ${escapeHtml(orderData.firstName)} ${escapeHtml(orderData.lastName)}<br>
                ${escapeHtml(orderData.address)}<br>
                ${escapeHtml(orderData.municipality)}, ${escapeHtml(orderData.city)}<br>
                Tel: ${escapeHtml(orderData.phone)}
              </p>
              <p style="margin-top: 12px; font-weight: bold;">
                🚚 Kurirska služba: ${escapeHtml(orderData.courierService)}
              </p>
            </div>

            <div style="background: #fef3c7; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-weight: bold;">💵 Plaćanje pouzećem</p>
              <p style="margin: 8px 0 0;">Iznos za plaćanje: ${orderData.total} RSD</p>
            </div>

            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
              <p>Imate pitanja? Kontaktirajte nas na info@pandabuds.rs</p>
              <p>© ${new Date().getFullYear()} Panda Buds. Sva prava zadržana.</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const customerEmailData = await customerEmailResponse.json();
    console.log("Customer email sent:", customerEmailData);

    // 2. Send Email to OWNER (YOU) with ALL details
    if (OWNER_EMAIL) {
      const ownerEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Panda Buds <porudzbine@pandabuds.rs>",
          to: [OWNER_EMAIL],
          subject: `💰 NOVA PORUDŽBINA: ${orderData.total} RSD (#${order.id.slice(0, 8).toUpperCase()})`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #166534;">🐼 Nova porudžbina! 💰</h1>
              
              <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Porudžbina #${order.id.slice(0, 8).toUpperCase()}</h2>
                <p style="font-size: 18px; font-weight: bold; color: #166534;">UKUPNO: ${orderData.total} RSD</p>
                <p style="font-size: 14px; color: #666;">Datum: ${new Date().toLocaleString('sr-RS')}</p>
              </div>

              <div style="background: #ffffff; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="color: #166534; margin-top: 0;">👤 Informacije o kupcu</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 40%;">Ime i prezime:</td>
                    <td style="padding: 8px 0;">${escapeHtml(orderData.firstName)} ${escapeHtml(orderData.lastName)}</td>
                  </tr>
                  <tr style="background: #f9fafb;">
                    <td style="padding: 8px; font-weight: bold;">Email:</td>
                    <td style="padding: 8px;"><a href="mailto:${escapeHtml(orderData.email)}">${escapeHtml(orderData.email)}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Telefon:</td>
                    <td style="padding: 8px 0;"><a href="tel:${escapeHtml(orderData.phone)}" style="color: #166534; font-weight: bold; font-size: 16px;">${escapeHtml(orderData.phone)}</a></td>
                  </tr>
                </table>
              </div>

              <div style="background: #ffffff; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="color: #166534; margin-top: 0;">📍 Adresa dostave</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 40%;">Ulica i broj:</td>
                    <td style="padding: 8px 0;">${escapeHtml(orderData.address)}</td>
                  </tr>
                  <tr style="background: #f9fafb;">
                    <td style="padding: 8px; font-weight: bold;">Grad:</td>
                    <td style="padding: 8px;">${escapeHtml(orderData.city)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Opština:</td>
                    <td style="padding: 8px 0;">${escapeHtml(orderData.municipality)}</td>
                  </tr>
                  <tr style="background: #f9fafb;">
                    <td style="padding: 8px; font-weight: bold;">🚚 Kurirska služba:</td>
                    <td style="padding: 8px; font-size: 16px; font-weight: bold; color: #166534;">${escapeHtml(orderData.courierService)}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #ffffff; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="color: #166534; margin-top: 0;">📦 Naručeni proizvodi</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #166534; color: white;">
                      <th style="padding: 12px; text-align: left;">Proizvod</th>
                      <th style="padding: 12px; text-align: center;">Količina</th>
                      <th style="padding: 12px; text-align: right;">Cena</th>
                    </tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                  <tfoot>
                    <tr style="background: #f9fafb;">
                      <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Poštarina:</td>
                      <td style="padding: 12px; text-align: right;">${orderData.shipping} RSD</td>
                    </tr>
                    <tr style="background: #dcfce7; font-weight: bold; font-size: 18px;">
                      <td colspan="2" style="padding: 15px; text-align: right;">💰 UKUPNO ZA NAPLATU:</td>
                      <td style="padding: 15px; text-align: right; color: #166534; font-size: 20px;">${orderData.total} RSD</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; font-size: 16px;">💵 Plaćanje pouzećem - Gotovina pri preuzimanju</p>
              </div>

              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                Automatska notifikacija - Panda Buds sistem
              </p>
            </body>
            </html>
          `,
        }),
      });

      const ownerEmailData = await ownerEmailResponse.json();
      
      if (!ownerEmailResponse.ok) {
        console.error("Failed to send owner notification email:", ownerEmailData);
      } else {
        console.log("Owner notification email sent successfully to:", OWNER_EMAIL);
      }
    }

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
        error: "Došlo je do greške. Molimo pokušajte ponovo." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
