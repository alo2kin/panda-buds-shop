// api/checkout.ts
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Inicijalizacija klijenata
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        total: orderData.total,
        // Dodaj ostala polja po potrebi
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
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.price} RSD</td>
      </tr>
    `).join('');

    // 4. Slanje mejla KUPCU
    await resend.emails.send({
      from: 'Panda Buds <onboarding@resend.dev>', // ⚠️ Promeni ovo kad verifikuješ domen
      to: orderData.email,
      subject: 'Vaša porudžbina je primljena! 🐼',
      html: `
        <h1>Hvala na poverenju, ${orderData.firstName}!</h1>
        <p>Broj porudžbine: #${order.id}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="text-align:left;">Proizvod</th>
            <th style="text-align:left;">Kol.</th>
            <th style="text-align:left;">Cena</th>
          </tr>
          ${itemsHtml}
        </table>
        <p><strong>Ukupno za naplatu: ${orderData.total} RSD</strong></p>
      `
    });

    // 5. Slanje mejla VLASNIKU (Tebi)
    const ownerEmail = process.env.OWNER_EMAIL; // Moraš dodati ovo u env varijable
    if (ownerEmail) {
      await resend.emails.send({
        from: 'Panda Buds <onboarding@resend.dev>',
        to: ownerEmail,
        subject: `Nova porudžbina #${order.id} - ${orderData.total} RSD`,
        html: `
          <h2>Nova porudžbina! 💰</h2>
          <p><strong>Kupac:</strong> ${orderData.firstName} ${orderData.lastName}</p>
          <p><strong>Telefon:</strong> ${orderData.phone}</p>
          <p><strong>Adresa:</strong> ${orderData.address}, ${orderData.city}</p>
          <h3>Stavke:</h3>
          <ul>
            ${orderData.items.map((i: any) => `<li>${i.name} x${i.quantity}</li>`).join('')}
          </ul>
          <h3>Ukupno: ${orderData.total} RSD</h3>
        `
      });
    }

    return res.status(200).json({ success: true, orderId: order.id });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
