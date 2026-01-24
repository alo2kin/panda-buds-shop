// api/checkout.ts
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Inicijalizacija klijenata
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// HTML escape helper
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req: any, res: any) {
  // CORS (da frontend može da priča sa backendom)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orderData = req.body;

    // 1. Validacija (ukratko)
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Korpa je prazna' });
    }

    // 2. Upis u Bazu (Supabase)
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
        subtotal: orderData.subtotal || orderData.total - (orderData.shipping || 0),
        shipping: orderData.shipping || 0,
        total: orderData.total,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: 'Greška pri čuvanju porudžbine' });
    }

    // 3. Generisanje HTML-a za proizvode
    const itemsHtml = orderData.items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${escapeHtml(item.name)}${item.color ? ` (${escapeHtml(item.color)})` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${(item.price * item.quantity).toLocaleString('sr-RS')} RSD
        </td>
      </tr>
    `).join('');

    // 4. Slanje mejla KUPCU
    await resend.emails.send({
      from: 'Panda Buds <porudzbine@pandabuds.rs>',
      to: orderData.email,
      subject: '🐼 Hvala na porudžbini - Panda Buds',
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
              Broj porudžbine: #${order.id.slice(0, 8).toUpperCase()}
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
                  <td style="padding: 12px; text-align: right;">${orderData.shipping || 0} RSD</td>
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
      `
    });

    // 5. Slanje mejla VLASNIKU (Tebi) - SA SVIM PODACIMA
    const ownerEmail = process.env.OWNER_EMAIL;
    
    console.log("Pokušavam da pošaljem gazdi na:", ownerEmail);

    if (ownerEmail) {
      try {
        const data = await resend.emails.send({
          from: 'Panda Buds <porudzbine@pandabuds.rs>',
          to: ownerEmail,
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
                      <td style="padding: 12px; text-align: right;">${orderData.shipping || 0} RSD</td>
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
          `
        });
        console.log("Mejl vlasniku POSLAT. ID:", data);
      } catch (ownerError) {
        console.error("GREŠKA pri slanju vlasniku:", ownerError);
      }
    } else {
      console.log("NEMA OWNER_EMAIL varijable u Vercelu!");
    }

    return res.status(200).json({ success: true, orderId: order.id });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
