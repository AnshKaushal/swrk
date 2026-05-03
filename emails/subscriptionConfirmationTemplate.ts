export const subscriptionConfirmationTemplate = (
  userName: string,
  planName: string,
  amount: number,
  nextBillingDate: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .plan-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .amount { font-size: 24px; font-weight: bold; color: #667eea; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Subscription Confirmed!</h1>
    <p>Welcome to the premium experience</p>
  </div>

  <div class="content">
    <h2>Hi ${userName},</h2>
    <p>Thank you for subscribing to our premium plan! Your subscription has been successfully activated.</p>

    <div class="plan-details">
      <h3>Subscription Details</h3>
      <p><strong>Plan:</strong> ${planName}</p>
      <p><strong>Amount:</strong> <span class="amount">₹${amount}</span></p>
      <p><strong>Next Billing Date:</strong> ${nextBillingDate}</p>
      <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
    </div>

    <p>You now have access to all premium features including:</p>
    <ul>
      <li>✅ Priority matching</li>
      <li>✅ Unlimited swipes</li>
      <li>✅ Advanced filters</li>
      <li>✅ Profile boost</li>
      <li>✅ Analytics dashboard</li>
      <li>✅ Premium support</li>
    </ul>

    <p>You can manage your subscription anytime from your <a href="${process.env.NEXTAUTH_URL}/settings">account settings</a>.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/settings" class="button">Manage Subscription</a>
    </div>

    <p>If you have any questions, feel free to reach out to our support team.</p>

    <p>Happy matching! 💕</p>
  </div>

  <div class="footer">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>&copy; 2024 SWRK. All rights reserved.</p>
  </div>
</body>
</html>
`
