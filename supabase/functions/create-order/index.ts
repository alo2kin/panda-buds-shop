import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------------------------------------------
// 👇👇👇 OVDE UPIŠI SVOJ EMAIL NA KOJI STIŽU PORUDŽBINE 👇👇👇
const OWNER_EMAIL = "smidt.ivan123@gmail.com"; 
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

    // Generate Items HTML
    const itemsHtml = orderData.items.map((item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.name)} (${escapeHtml(item.color)})</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${(item.price * item.quantity).toLocaleString("sr-RS")} RSD</td>
      </tr>
    `).join("");

    // 1. Send Email to CUSTOMER
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Panda Buds <onboarding@resend.dev>",
        to: [orderData.email],
        subject: "🐼 Hvala na porudžbini - Panda Buds",
        html: `
          <!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center;"><h1>🐼 Panda Buds</h1></div>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2>Hvala, ${escapeHtml(orderData.firstName)}!</h2>
              <p>Porudžbina <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> je primljena.</p>
            </div>
            <h3>📦 Vaša korpa</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead><tr style="background: #e5e7eb;"><th align="left">Proizvod</th><th>Kom.</th><th align="right">Cena</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr><td colspan="2" align="right">Dostava:</td><td align="right">${orderData.shipping} RSD</td></tr>
                <tr style="font-weight: bold;"><td colspan="2" align="right">UKUPNO:</td><td align="right" style="color: #166534;">${orderData.total} RSD</td></tr>
              </tfoot>
            </table>
            <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">Panda Buds © ${new Date().getFullYear()}</p>
          </body></html>
        `,
      }),
    });

    // 2. Send Email to OWNER (YOU)
    if (OWNER_EMAIL && !OWNER_EMAIL.includes("tvoj_pravi_email")) {
      const ownerRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Panda Buds <onboarding@resend.dev>",
          to: [OWNER_EMAIL],
          subject: `💰 NOVA PORUDŽBINA: ${orderData.total} RSD (#${order.id.slice(0, 8)})`,
          html: `
            <!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #166534;">Nova porudžbina! 💰</h1>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <p><strong>Kupac:</strong> ${escapeHtml(orderData.firstName)} ${escapeHtml(orderData.lastName)}</p>
                <p><strong>Email:</strong> ${escapeHtml(orderData.email)}</p>
                <p><strong>Telefon:</strong> <a href="tel:${escapeHtml(orderData.phone)}">${escapeHtml(orderData.phone)}</a></p>
                <p><strong>Adresa:</strong> ${escapeHtml(orderData.address)}, ${escapeHtml(orderData.city)}</p>
                <p><strong>Kurir:</strong> ${escapeHtml(orderData.courierService)}</p>
              </div>
              <h3>Artikli:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                  <tr style="background: #dcfce7; font-weight: bold; font-size: 1.2em;">
                    <td colspan="2" style="padding: 10px;">ZARADA (Total):</td>
                    <td style="padding: 10px; text-align: right;">${orderData.total} RSD</td>
                  </tr>
                </tfoot>
              </table>
            </body></html>
          `,
        }),
      });
      
      if (!ownerRes.ok) {
        console.error("Greska pri slanju mejla vlasniku:", await ownerRes.text());
      } else {
        console.log("Mejl poslat vlasniku na:", OWNER_EMAIL);
      }
    } else {
      console.log("Nisi podesio OWNER_EMAIL u 4. liniji koda!");
    }

    return new Response(JSON.stringify({ success: true, orderId: order.id }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: "Greška na serveru." }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
