async function sendEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Transactional email service is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
  });
  if (!response.ok) throw new Error(`Email delivery failed: ${(await response.text()).slice(0, 200)}`);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendEmail({
    to: email,
    subject: "Reset your Aurelia Ornaments password",
    html: `<p>We received a request to reset your Aurelia Ornaments password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}

export async function sendOrderConfirmationEmail(input: {
  email: string; orderId: string; total: number;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}) {
  const rows = input.items.map((item) =>
    `<tr><td style="padding:8px 0">${item.name} × ${item.quantity}</td><td style="padding:8px 0;text-align:right">₹${(item.unitPrice * item.quantity).toLocaleString("en-IN")}</td></tr>`
  ).join("");
  await sendEmail({
    to: input.email,
    subject: `Order confirmed · Aurelia Ornaments #${input.orderId.slice(-8)}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1>Aurelia Ornaments</h1><p>Thank you. Your payment was received and your order is confirmed.</p><p><strong>Order #${input.orderId.slice(-8)}</strong></p><table style="width:100%;border-collapse:collapse">${rows}</table><hr/><p style="text-align:right"><strong>Total: ₹${input.total.toLocaleString("en-IN")}</strong></p><p>We’ll email you again when your order ships.</p></div>`,
  });
}
