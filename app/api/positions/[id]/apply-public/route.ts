import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import PublicApplication from "@/models/public-application"
import User from "@/models/user"
import transporter from "@/lib/mailer"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await db()
    const { id } = await params

    const position = await Position.findById(id)
    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (position.status !== "active") {
      return NextResponse.json({ error: "Position is not active" }, { status: 400 })
    }

    const body = await req.json()
    const { name, email, phone, linkedin, location, workExperience, agreedToTerms, resumeUrl, resumeFileName, applicationData } = body

    if (!name || !email || !agreedToTerms) {
      return NextResponse.json(
        { error: "Name, email, and terms agreement are required" },
        { status: 400 },
      )
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        { error: "You must agree to the terms and conditions" },
        { status: 400 },
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingApplication = await PublicApplication.findOne({
      positionId: id,
      email: normalizedEmail,
    })
    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this position" },
        { status: 409 },
      )
    }

    let candidateId = null
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      candidateId = existingUser._id
    }

    const application = new PublicApplication({
      positionId: id,
      employerId: position.employerId,
      candidateId,
      name,
      email,
      phone: phone || "",
      linkedin: linkedin || "",
      location: location || "",
      workExperience: workExperience || "",
      agreedToTerms,
      applicationData: applicationData || {},
      resumeUrl: resumeUrl || "",
      resumeFileName: resumeFileName || "",
      isExternal: position.isExternal || false,
      externalLink: position.externalLink || "",
    })

    await application.save()

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Application submitted - ${position.title}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Application Submitted</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
          <tr>
            <td style="padding:36px 40px 28px;border-bottom:1px solid #2a2a2a;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                SW<span style="color:#6ee7b7;">RK</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#a1a1aa;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Application submitted</p>
              <h1 style="margin:0 0 16px;color:#ffffff;font-size:26px;font-weight:700;line-height:1.2;">
                Application sent successfully!
              </h1>
              <p style="margin:0 0 8px;color:#d4d4d8;font-size:15px;line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6;">
                Your application for <strong style="color:#e4e4e7;">${position.title}</strong> has been received. The recruiter will review your profile and contact you if there's a match.
              </p>

              <div style="background:#0f0f0f;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 12px;color:#a1a1aa;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Position Details</p>
                <p style="margin:0 0 4px;color:#ffffff;font-size:16px;font-weight:600;">${position.title}</p>
                <p style="margin:0;color:#71717a;font-size:14px;">${position.locations?.join(", ") || "Remote"} · ${position.employmentType || "Full-time"}</p>
              </div>

              <p style="margin:0 0 8px;color:#71717a;font-size:14px;line-height:1.6;">
                Want to track your application? Create an account on SWRK to get real-time updates when the recruiter views your profile.
              </p>
              <p style="margin:0;color:#52525b;font-size:13px;line-height:1.6;">
                If you didn't submit this application, you can ignore this email.
              </p>
            </td>
          </tr>
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
        `.trim(),
        text: `Application submitted successfully!\n\nHi ${name},\n\nYour application for ${position.title} has been received. The recruiter will review it and contact you if your profile matches.\n\n- SWRK`,
      })
    } catch (emailErr) {
      console.error("Failed to send application confirmation email:", emailErr)
    }

    return NextResponse.json({
      success: true,
      hasAccount: !!candidateId,
      externalLink: position.isExternal ? position.externalLink : null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    )
  }
}
