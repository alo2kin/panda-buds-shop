import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderData, customerEmail } = req.body;

  try {
    // Mejl za tebe (vlasniku)
    await resend.emails.send({
      from: 'noreply@panda-buds.com',
      to: 'pandabuds@pokloni.com', // Tvoj email
      subject: 'Nova porudžbina - Panda Buds Shop',
      html: `
        <h2>Nova porudžbina!</h2>
        <p><strong>Ime:</strong> ${orderData.name}</p>
        <p><strong>Email:</strong> ${orderData.email}</p>
        <p><strong>Telefon:</strong> ${orderData.phone}</p>
        <p><strong>Adresa:</strong> ${orderData.address}</p>
        <h3>Poručeni proizvodi:</h3>
        <ul>
          ${orderData.items.map(item => `
            <li>${item.name} - Količina: ${item.quantity} - Cena: ${item.price} RSD</li>
          `).join('')}
        </ul>
        <p><strong>Ukupno:</strong> ${orderData.total} RSD</p>
      `
    });

    // Mejl za kupca
    await resend.emails.send({
      from: 'noreply@panda-buds.com',
      to: customerEmail,
      subject: 'Potvrda porudžbine - Panda Buds Shop',
      html: `
        <h2>Hvala na porudžbini!</h2>
        <p>Poštovani/a ${orderData.name},</p>
        <p>Vaša porudžbina je uspešno primljena!</p>
        <h3>Detalji porudžbine:</h3>
        <ul>
          ${orderData.items.map(item => `
            <li>${item.name} - Količina: ${item.quantity}</li>
          `).join('')}
        </ul>
        <p><strong>Ukupan iznos:</strong> ${orderData.total} RSD</p>
        <p>Kontaktiraćemo vas uskoro.</p>
        <p>Srdačan pozdrav,<br>Panda Buds Tim</p>
      `
    });

    return res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Failed to send emails' });
  }
}






