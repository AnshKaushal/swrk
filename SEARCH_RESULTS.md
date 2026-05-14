# Codebase Search Results

## 1. Interview Dialog/Modal Components

### Schedule Interview Modal

**File:** [components/schedule-interview-modal.tsx](components/schedule-interview-modal.tsx)

- Main modal for scheduling interviews with Google Meet functionality
- Creates automatic Google Meet links using `generateMeetCode()`
- Collects: title, description, date/time, duration, timezone
- Sends POST to `/api/interviews`
- Shows alert if interview already exists for the match

**Key Code:**

```tsx
const googleMeetLink = `https://meet.google.com/${generateMeetCode()}`

const interview = new Interview({
  match: matchId,
  scheduledFor: new Date(scheduledFor),
  timezone: timezone || "UTC",
  duration: duration || 60,
  title,
  description,
  createdBy: session.user.id,
  interviewLink: googleMeetLink,
  employer: match.employer._id,
  employee: match.employee._id,
  status: "scheduled",
})
```

### Interview Message Component

**File:** [components/interview-message.tsx](components/interview-message.tsx)

- Displays interview details in messages
- Handles confirm/decline responses
- "Join Google Meet" button opens interview link
- "Add to Calendar" downloads ICS file
- Shows status: scheduled/confirmed/denied/completed

**Key Code:**

```tsx
const handleOpenMeet = () => {
  window.open(interview.interviewLink, "_blank", "noopener,noreferrer")
}

{(localStatus === "confirmed" || localStatus === "scheduled") && (
  <div className="mt-3 flex flex-wrap gap-2">
    <Button
      onClick={handleOpenMeet}
      size="sm"
      variant="default"
      className="gap-2"
    >
      <Video className="h-4 w-4" />
      Join Meet
    </Button>
```

### Interview Feedback Dialog

**File:** [components/interview-feedback-dialog.tsx](components/interview-feedback-dialog.tsx)

- Post-interview feedback submission
- Star ratings for: responsiveness, communication, professionalism, punctuality, overall
- Text feedback field
- Only accessible after interview time has passed

---

## 2. MessageCircle Button Implementation

**Files:**

- [components/dashboard/recruiter-dashboard.tsx](components/dashboard/recruiter-dashboard.tsx) (line 330)
- [components/dashboard/candidate-dashboard.tsx](components/dashboard/candidate-dashboard.tsx) (line 347)

**Current Implementation:**

```tsx
<Button variant="ghost" size="sm">
  <MessageCircle className="w-4 h-4" />
</Button>
```

**Status:** Button exists but **has NO onClick handler** - this appears to be incomplete functionality

- Used in "Recent Matches" section of both dashboards
- Shows next to each matched candidate/employer
- **Should probably navigate to messages with that specific match**

---

## 3. /api/interviews Endpoints

### POST /api/interviews - Create Interview

**File:** [app/api/interviews/route.ts](app/api/interviews/route.ts#L44)

- Requires: matchId, title, scheduledFor, optional description/timezone/duration
- Validates employer is creating (not employee)
- Generates Google Meet link
- Creates Interview record + Message record
- Sends notification to employee
- Emits Socket.io events for real-time updates

**Key Code:**

```ts
export async function POST(req: NextRequest) {
  const { matchId, title, description, scheduledFor, timezone, duration } =
    await req.json()
  const googleMeetLink = `https://meet.google.com/${generateMeetCode()}`

  const interview = new Interview({
    match: matchId,
    scheduledFor: new Date(scheduledFor),
    timezone: timezone || "UTC",
    duration: duration || 60,
    title,
    description,
    createdBy: session.user.id,
    interviewLink: googleMeetLink,
    employer: match.employer._id,
    employee: match.employee._id,
    status: "scheduled",
  })
}
```

### GET /api/interviews - Fetch Interviews

**File:** [app/api/interviews/route.ts](app/api/interviews/route.ts#L117)

- Filters by current user (employer or employee)
- Optional filters: status, matchId
- Returns populated interview details with employer/employee info

**Key Code:**

```ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const matchId = searchParams.get("matchId")

  let query: any = {
    $or: [{ employer: session.user.id }, { employee: session.user.id }],
  }

  const interviews = await Interview.find(query)
    .populate("match")
    .populate("employer", "name avatar companyName")
    .populate("employee", "name avatar headline")
    .sort({ scheduledFor: 1 })
}
```

### PUT /api/interviews/[id] - Update Interview Status

**File:** [app/api/interviews/[id]/route.ts](app/api/interviews/[id]/route.ts)

- Updates interview status: confirmed or denied
- Only employee can respond to scheduled interview
- Creates response message
- Sends notification to other party
- Emits Socket.io events

**Key Code:**

```ts
export async function PUT(req: NextRequest, { params }) {
  const { status, reason } = await req.json()

  if (status === "confirmed") {
    interview.status = "confirmed"
    interview.confirmedAt = new Date()
  } else if (status === "denied") {
    interview.status = "denied"
    interview.deniedAt = new Date()
    interview.deniedReason = reason || ""
  }

  const responseMessage = await Message.create({
    match: interview.match,
    sender: session.user.id,
    senderRole,
    type: "interview",
    interviewId: interview._id,
    interviewMessageType: "response",
    content: responseContent,
  })
}
```

### GET /api/interviews/[id]/feedback - Get Interview Feedback

**File:** [app/api/interviews/[id]/feedback/route.ts](app/api/interviews/[id]/feedback/route.ts)

- Retrieves existing feedback if submitted
- Checks if user can submit feedback (after interview time)

---

## 4. Google Meet Related Code

### Meet Link Generation

**File:** [app/api/interviews/route.ts](app/api/interviews/route.ts#L161)

```ts
function generateMeetCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz"
  let code = ""
  for (let i = 0; i < 21; i++) {
    if (i === 7 || i === 14) {
      code += "-"
    } else {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  return code
}
// Generates: https://meet.google.com/{code}
```

### Open Meet Function

**File:** [app/dashboard/interviews/page.tsx](app/dashboard/interviews/page.tsx#L175)

```ts
const handleOpenMeet = (interviewLink: string) => {
  window.open(interviewLink, "_blank", "noopener,noreferrer")
}
```

### UI References to "Join Google Meet"

- [components/interview-message.tsx](components/interview-message.tsx#L329) - "Join Google Meet" button
- [app/dashboard/interviews/page.tsx](app/dashboard/interviews/page.tsx#L377) - "Join Google Meet" button
- [components/schedule-interview-modal.tsx](components/schedule-interview-modal.tsx) - Note mentions "Google Meet link will be automatically generated"

---

## 5. Interview Data Model

**File:** [models/interview.ts](models/interview.ts)

```ts
const InterviewSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
  scheduledFor: { type: Date, required: true },
  timezone: { type: String, default: "UTC" },
  duration: { type: Number, default: 60 },
  title: { type: String, required: true },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  interviewLink: { type: String, required: true },
  status: {
    type: String,
    enum: ["scheduled", "confirmed", "denied", "completed", "cancelled"],
    default: "scheduled",
  },
  confirmedAt: Date,
  deniedAt: Date,
  deniedReason: String,
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
})
```

---

## Summary

| Component                  | Status        | Notes                                                      |
| -------------------------- | ------------- | ---------------------------------------------------------- |
| Interview Scheduling Modal | ✅ Complete   | Auto-generates Google Meet links                           |
| Interview Message Display  | ✅ Complete   | Shows meet link, confirm/decline                           |
| Feedback Dialog            | ✅ Complete   | Post-interview ratings                                     |
| API: POST /interviews      | ✅ Complete   | Creates interview + notification                           |
| API: GET /interviews       | ✅ Complete   | Fetches user's interviews                                  |
| API: PUT /interviews/[id]  | ✅ Complete   | Updates status                                             |
| MessageCircle Button       | ⚠️ Incomplete | **NO onClick handler** - should navigate to match messages |
| Google Meet Integration    | ✅ Complete   | Link generation + opening                                  |
