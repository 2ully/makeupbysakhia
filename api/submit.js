export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fname, lname, phone, service, date, time, message } = req.body;

  // Basic validation
  if (!fname || !lname || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Makeup by Sakhia <onboarding@resend.dev>',
        to: 'sakiaalhinai@gmail.com',
        subject: `New Booking Request from ${fname} ${lname}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fdf8f5; border: 1px solid #e8ddd5;">
            <h2 style="color: #5c3d2e; font-size: 24px; margin-bottom: 4px;">✦ New Booking Request</h2>
            <p style="color: #9e7e6e; font-size: 13px; margin-top: 0;">Makeup by Sakhia — Client Inquiry</p>
            <hr style="border: none; border-top: 1px solid #e8ddd5; margin: 24px 0;" />
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #9e7e6e; font-size: 13px; width: 140px;">👤 Full Name</td>
                <td style="padding: 10px 0; color: #3a2820; font-size: 14px; font-weight: bold;">${fname} ${lname}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #9e7e6e; font-size: 13px;">📱 Phone</td>
                <td style="padding: 10px 0; color: #3a2820; font-size: 14px;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #9e7e6e; font-size: 13px;">💄 Service</td>
                <td style="padding: 10px 0; color: #3a2820; font-size: 14px;">${service || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #9e7e6e; font-size: 13px;">📅 Date</td>
                <td style="padding: 10px 0; color: #3a2820; font-size: 14px;">${date || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #9e7e6e; font-size: 13px;">🕐 Time</td>
                <td style="padding: 10px 0; color: #3a2820; font-size: 14px;">${time || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #9e7e6e; font-size: 13px; vertical-align: top;">💬 Vision</td>
                <td style="padding: 10px 0; color: #3a2820; font-size: 14px;">${message || 'No message provided'}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e8ddd5; margin: 24px 0;" />
            <p style="color: #9e7e6e; font-size: 12px; text-align: center;">This email was sent automatically from your booking form at makeupbysakhia.vercel.app</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
