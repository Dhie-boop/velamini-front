import { render } from "@react-email/render";
import ResetPasswordEmail from "@/emails/reset-password";
import { sendEmail } from "@/lib/resend-email";

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetPasswordLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://velamini.com"}/auth/reset-password?token=${token}`;
  const html = await render(
    ResetPasswordEmail({ resetPasswordLink })
  );
  return sendEmail({
    to,
    subject: "Reset your Velamini password",
    html,
  });
}
