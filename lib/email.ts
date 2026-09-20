export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Password reset email service is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your Aurelia Ornaments password",
      html: `<p>We received a request to reset your Aurelia Ornaments password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) throw new Error("Unable to send password reset email.");
}
