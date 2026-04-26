export function otpEmailTemplate({
  otp,
  name = "there",
}: {
  otp: string
  name?: string
}) {
  return {
    subject: `${otp} is your Linkder verification code`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 28px;border-bottom:1px solid #2a2a2a;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Link<span style="color:#6ee7b7;">der</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#a1a1aa;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Email verification</p>
              <h1 style="margin:0 0 24px;color:#ffffff;font-size:26px;font-weight:700;line-height:1.2;">
                Hey ${name}, here's your code
              </h1>
              <p style="margin:0 0 32px;color:#71717a;font-size:15px;line-height:1.6;">
                Use the code below to verify your email address. It expires in <strong style="color:#a1a1aa;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#0f0f0f;border:1px solid #2a2a2a;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <span style="font-size:48px;font-weight:900;color:#6ee7b7;letter-spacing:16px;font-variant-numeric:tabular-nums;">
                  ${otp}
                </span>
              </div>

              <p style="margin:0;color:#52525b;font-size:13px;line-height:1.6;">
                If you didn't request this, you can safely ignore this email. Someone may have typed your address by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a2a;">
              <p style="margin:0;color:#3f3f46;font-size:12px;">
                © ${new Date().getFullYear()} Linkder · The professional matching network
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `Your Linkder verification code is: ${otp}\n\nExpires in 10 minutes. If you didn't request this, ignore this email.`,
  }
}
