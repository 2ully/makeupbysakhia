import {
  getSupabase,
  getMailer,
  escapeHtml,
  WHATSAPP_URL,
  WHATSAPP_DISPLAY,
  SITE_URL,
} from './_lib.js';

// Reusable WhatsApp button + clickable number link for customer emails.
const whatsappBlock = `
  <p style="text-align:center;margin:24px 0 8px;">
    <a href="${WHATSAPP_URL}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;">💬 Chat on WhatsApp</a>
  </p>
  <p style="text-align:center;color:#9e7e6e;font-size:13px;margin:0;">or message <a href="${WHATSAPP_URL}" style="color:#5c3d2e;">${WHATSAPP_DISPLAY}</a></p>`;

// GET /api/confirm?token=...&action=confirm|decline
// Opened by the manager from the buttons in the notification email.
// confirm  -> status = confirmed, customer is emailed a confirmation.
// decline  -> status = declined, the slot frees up again.
export default async function handler(req, res) {
  const { token, action } = req.query;

  if (!token || (action !== 'confirm' && action !== 'decline')) {
    return sendPage(res, 400, 'Invalid link', 'This confirmation link is malformed.');
  }

  try {
    const supabase = getSupabase();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;
    if (!booking) {
      return sendPage(res, 404, 'Not found', 'This booking could not be found.');
    }

    // Already handled — show a friendly notice instead of acting twice.
    if (booking.status !== 'pending') {
      const word = booking.status === 'confirmed' ? 'confirmed' : 'declined';
      return sendPage(
        res,
        200,
        'Already handled',
        `This booking for ${escapeHtml(booking.fname)} ${escapeHtml(booking.lname)} on ${escapeHtml(booking.date)} at ${escapeHtml(booking.time)} was already <strong>${word}</strong>.`
      );
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'declined';

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', booking.id)
      .eq('status', 'pending'); // guard against a double click race

    if (updateError) throw updateError;

    if (action === 'confirm') {
      await sendCustomerEmail(booking);
      return sendPage(
        res,
        200,
        'Booking confirmed ✓',
        `You confirmed ${escapeHtml(booking.fname)} ${escapeHtml(booking.lname)}'s session on <strong>${escapeHtml(booking.date)}</strong> at <strong>${escapeHtml(booking.time)}</strong>. A confirmation email has been sent to the customer.`
      );
    }

    await sendDeclineEmail(booking);
    return sendPage(
      res,
      200,
      'Booking declined',
      `The booking for ${escapeHtml(booking.fname)} ${escapeHtml(booking.lname)} on ${escapeHtml(booking.date)} at ${escapeHtml(booking.time)} was declined and the slot is now open again. The customer has been emailed and invited to rebook or reach you on WhatsApp.`
    );
  } catch (err) {
    console.error('Confirm error:', err);
    return sendPage(res, 500, 'Something went wrong', 'Please try again in a moment.');
  }
}

async function sendCustomerEmail(b) {
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#fdf8f5;border:1px solid #e8ddd5;">
      <h2 style="color:#5c3d2e;font-size:24px;margin-bottom:4px;">✦ Your Booking is Confirmed</h2>
      <p style="color:#9e7e6e;font-size:13px;margin-top:0;">Makeup by Sakhia</p>
      <hr style="border:none;border-top:1px solid #e8ddd5;margin:24px 0;" />
      <p style="color:#3a2820;font-size:15px;">Hi ${escapeHtml(b.fname)},</p>
      <p style="color:#3a2820;font-size:15px;">Great news — your makeup session is confirmed! Here are your details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#9e7e6e;font-size:13px;width:120px;">💄 Service</td><td style="padding:8px 0;color:#3a2820;font-size:14px;">${escapeHtml(b.service) || 'Makeup session'}</td></tr>
        <tr><td style="padding:8px 0;color:#9e7e6e;font-size:13px;">📅 Date</td><td style="padding:8px 0;color:#3a2820;font-size:14px;">${escapeHtml(b.date)}</td></tr>
        <tr><td style="padding:8px 0;color:#9e7e6e;font-size:13px;">🕐 Time</td><td style="padding:8px 0;color:#3a2820;font-size:14px;">${escapeHtml(b.time)}</td></tr>
      </table>
      <p style="color:#3a2820;font-size:15px;">If you need to reschedule or have any questions, just reply to this email or reach me on WhatsApp:</p>
      ${whatsappBlock}
      <p style="color:#3a2820;font-size:15px;text-align:center;margin-top:24px;">Can't wait to make you glow ✨</p>
      <hr style="border:none;border-top:1px solid #e8ddd5;margin:24px 0;" />
      <p style="color:#b3a49a;font-size:12px;text-align:center;">Makeup by Sakhia</p>
    </div>`;

  await getMailer().sendMail({
    from: `Makeup by Sakhia <${process.env.GMAIL_USER}>`,
    to: b.email,
    subject: `Your booking is confirmed — ${b.date} at ${b.time}`,
    html,
  });
}

async function sendDeclineEmail(b) {
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#fdf8f5;border:1px solid #e8ddd5;">
      <h2 style="color:#5c3d2e;font-size:24px;margin-bottom:4px;">About Your Booking Request</h2>
      <p style="color:#9e7e6e;font-size:13px;margin-top:0;">Makeup by Sakhia</p>
      <hr style="border:none;border-top:1px solid #e8ddd5;margin:24px 0;" />
      <p style="color:#3a2820;font-size:15px;">Hi ${escapeHtml(b.fname)},</p>
      <p style="color:#3a2820;font-size:15px;">Thank you so much for your interest! Unfortunately I'm not able to take your requested slot on <strong>${escapeHtml(b.date)}</strong> at <strong>${escapeHtml(b.time)}</strong>.</p>
      <p style="color:#3a2820;font-size:15px;">Please don't be discouraged — I'd love to find a time that works. You can pick another date or time on my website, or just message me on WhatsApp and we'll sort it out together.</p>
      <p style="text-align:center;margin:24px 0 8px;">
        <a href="${SITE_URL}/#booking" style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;">📅 Book Another Time</a>
      </p>
      ${whatsappBlock}
      <p style="color:#3a2820;font-size:15px;text-align:center;margin-top:24px;">Hope to see you soon ✨</p>
      <hr style="border:none;border-top:1px solid #e8ddd5;margin:24px 0;" />
      <p style="color:#b3a49a;font-size:12px;text-align:center;">Makeup by Sakhia</p>
    </div>`;

  await getMailer().sendMail({
    from: `Makeup by Sakhia <${process.env.GMAIL_USER}>`,
    to: b.email,
    subject: `Update on your booking request — ${b.date}`,
    html,
  });
}

// Minimal styled HTML page shown to the manager in their browser.
function sendPage(res, status, title, body) {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — Makeup by Sakhia</title>
<style>
  body{font-family:'Jost',Arial,sans-serif;background:#f5f0eb;color:#2c2218;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;}
  .card{background:#fff;border:1px solid #dfd7cd;border-radius:8px;max-width:460px;padding:40px;text-align:center;box-shadow:0 2px 20px rgba(44,34,24,0.07);}
  h1{font-family:Georgia,serif;color:#5c3d2e;font-size:1.6rem;margin:0 0 12px;}
  p{color:#7a6555;line-height:1.6;font-size:1rem;}
  a{display:inline-block;margin-top:24px;color:#c4956a;text-decoration:none;font-size:0.9rem;}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p>
<a href="https://makeupbysakhia.vercel.app/">← Back to site</a></div></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(status).send(html);
}
