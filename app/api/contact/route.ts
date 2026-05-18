import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/mongodb"
import Contact from "@/models/contact"
import transporter from "@/lib/mailer"

const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM

const contactEmailTemplate = (
  name: string,
  email: string,
  subject: string,
  message: string,
) => {
  return {
    userSubject: `We've received your message - ${subject}`,
    userHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #000; font-size: 24px; margin-bottom: 16px;">Thank you for reaching out!</h2>
        <p style="color: #666; font-size: 16px; margin-bottom: 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #666; font-size: 16px; margin-bottom: 24px;">We've received your message and appreciate you taking the time to contact us. Our team will review your inquiry and get back to you as soon as possible.</p>
        <div style="background-color: #f5f5f5; padding: 16px; border-left: 4px solid #000; margin-bottom: 24px;">
          <p style="color: #666; margin: 0 0 8px 0;"><strong>Subject:</strong> ${subject}</p>
          <p style="color: #666; margin: 0;"><strong>Your Email:</strong> ${email}</p>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">Best regards,<br/>The Mutch Team</p>
      </div>
    `,
    userText: `Thank you for reaching out!\n\nHi ${name},\n\nWe've received your message and appreciate you taking the time to contact us. Our team will review your inquiry and get back to you as soon as possible.\n\nSubject: ${subject}\nYour Email: ${email}\n\nBest regards,\nThe Mutch Team`,
    adminSubject: `New Contact Inquiry - ${subject}`,
    adminHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #000; font-size: 24px; margin-bottom: 16px;">New Contact Inquiry</h2>
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #666; margin: 0 0 12px 0;"><strong>Name:</strong> ${name}</p>
          <p style="color: #666; margin: 0 0 12px 0;"><strong>Email:</strong> ${email}</p>
          <p style="color: #666; margin: 0;"><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="background-color: #fff; padding: 16px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #333; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `,
    adminText: `New Contact Inquiry\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      )
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 },
      )
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      )
    }

    await db()

    const contact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
    })

    await contact.save()

    const templates = contactEmailTemplate(
      name.trim(),
      email.toLowerCase().trim(),
      subject.trim(),
      message.trim(),
    )

    await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email.toLowerCase().trim(),
        subject: templates.userSubject,
        html: templates.userHtml,
        text: templates.userText,
      }),
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: adminEmail,
        subject: templates.adminSubject,
        html: templates.adminHtml,
        text: templates.adminText,
      }),
    ])

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your message. We'll get back to you soon!",
        contactId: contact._id.toString(),
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("[contact]", err)
    return NextResponse.json(
      { error: "Failed to submit your inquiry" },
      { status: 500 },
    )
  }
}
