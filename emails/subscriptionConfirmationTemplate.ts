export const subscriptionConfirmationTemplate = (
  userName: string,
  planName: string,
  amount: number,
  nextBillingDate: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Subscription Confirmed</title>
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
                SW<span style="color:#6ee7b7;">RK</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#a1a1aa;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Subscription confirmed</p>
              <h1 style="margin:0 0 16px;color:#ffffff;font-size:26px;font-weight:700;line-height:1.2;">
                Welcome to Premium!
              </h1>
              <p style="margin:0 0 24px;color:#d4d4d8;font-size:15px;line-height:1.6;">
                Hi <strong>${userName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6;">
                Thank you for subscribing to <strong style="color:#e4e4e7;">${planName}</strong>! Your subscription has been successfully activated.
              </p>

              <div style="background:#0f0f0f;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 12px;color:#a1a1aa;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Subscription Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;color:#71717a;font-size:14px;">Plan</td>
                    <td style="padding:4px 0;color:#ffffff;font-size:14px;text-align:right;font-weight:600;">${planName}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#71717a;font-size:14px;">Amount</td>
                    <td style="padding:4px 0;color:#6ee7b7;font-size:18px;text-align:right;font-weight:800;">₹${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#71717a;font-size:14px;">Next billing</td>
                    <td style="padding:4px 0;color:#d4d4d8;font-size:14px;text-align:right;">${nextBillingDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#71717a;font-size:14px;">Status</td>
                    <td style="padding:4px 0;color:#6ee7b7;font-size:14px;text-align:right;font-weight:600;">Active</td>
                  </tr>
                </table>
              </div>

              <p style="margin:0 0 16px;color:#a1a1aa;font-size:14px;font-weight:600;">Premium features unlocked:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:4px 0;color:#71717a;font-size:14px;">✓ Priority matching</td>
                  <td style="padding:4px 0;color:#71717a;font-size:14px;">✓ Unlimited swipes</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#71717a;font-size:14px;">✓ Advanced filters</td>
                  <td style="padding:4px 0;color:#71717a;font-size:14px;">✓ Profile boost</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#71717a;font-size:14px;">✓ Analytics dashboard</td>
                  <td style="padding:4px 0;color:#71717a;font-size:14px;">✓ Premium support</td>
                </tr>
              </table>

              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXTAUTH_URL || ""}/settings/subscription" style="display:inline-block;background:#6ee7b7;color:#0f0f0f;font-size:15px;font-weight:700;padding:14px 32px;text-decoration:none;border-radius:10px;">Manage Subscription</a>
              </div>

              <p style="margin:0;color:#52525b;font-size:13px;line-height:1.6;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a2a;">
              <p style="margin:0;color:#3f3f46;font-size:12px;">
                © ${new Date().getFullYear()} SWRK · The professional matching network
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
