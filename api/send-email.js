// api/send-email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Dozvoli samo POST zahteve
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { order, customerEmail, adminEmail } = req.body;

  try {
    // 1. Slanje mejla KUPCU
    await resend.emails.send({
      from: 'Panda Buds <onboarding@resend.dev>', // Kasnije možeš verifikovati svoj domen
      to: customerEmail,
      subject: 'Vaša porudžbina je primljena! 🐼',
      html: `
        <h1>Hvala na poverenju!</h1>
        <p>Vaša porudžbina je uspešno primljena.</p>
        <p><strong>Proizvodi:</strong></p>
        <ul>
          ${order.items.map(item => `<li>${item.name} - ${item.quantity} kom</li>`).join('')}
        </ul>
        <p><strong>Ukupno:</strong> ${order.total} RSD</p>
      `
    });

    // 2. Slanje mejla TEBI (Adminu)
    await resend.emails.send({
      from: 'Panda Buds <onboarding@resend.dev>',
      to: adminEmail,
      subject: 'Nova porudžbina na sajtu!',
      html: `
        <h1>Nova porudžbina! 💰</h1>
        <p><strong>Kupac:</strong> ${customerEmail}</p>
        <p><strong>Adresa:</strong> ${order.address}</p>
        <p><strong>Ukupno:</strong> ${order.total} RSD</p>
      `
    });

    return res.status(200).json({ message: 'Mejlovi poslati uspešno' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Greška pri slanju mejla' });
  }
}