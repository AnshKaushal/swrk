"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import type { Socket } from "socket.io-client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getSocketClient } from "@/lib/socket-client"
import {
  ChevronLeft,
  EllipsisVertical,
  Info,
  Loader2,
  FileText,
  MessageSquare,
  Paperclip,
  Flag,
  Mail,
  MailOpen,
  Link2,
  Search,
  Send,
  Smile,
  Sparkles,
  CheckCheck,
  Trash2,
  Eraser,
} from "lucide-react"
import { toast } from "sonner"
import { InterviewMessageComponent } from "@/components/interview-message"
import { ScheduleInterviewModal } from "@/components/schedule-interview-modal"

type Person = {
  _id: string
  name?: string
  avatar?: string
  username?: string
  email?: string
  role?: string
  activeRole?: string
  companyName?: string
  headline?: string
  isOnline?: boolean
  lastSeen?: string
}
type MatchRecord = {
  _id: string
  employer: Person
  employee: Person
  lastMessageAt?: string
  lastMessagePreview?: string
  unreadByEmployer?: number
  unreadByEmployee?: number
  status?: string
  matchedAt?: string
  typingUsers?: string[]
  typingUpdatedAt?: string
  clearedAtByEmployer?: string
  clearedAtByEmployee?: string
  deletedAtByEmployer?: string
  deletedAtByEmployee?: string
}

type MessageRecord = {
  _id: string
  match: string
  sender: Person
  senderRole: "employer" | "employee"
  type: "text" | "starter" | "cv-share" | "linkedin" | "interview" | "system"
  content?: string
  attachmentUrl?: string
  attachmentType?: "cv" | "portfolio" | "other"
  attachmentName?: string
  interviewId?: string
  interviewMessageType?: "scheduled" | "response"
  interview?: {
    _id: string
    title: string
    description?: string
    scheduledFor: string
    timezone: string
    duration: number
    status: "scheduled" | "confirmed" | "denied" | "completed" | "cancelled"
    interviewLink: string
    createdBy: string
    employer: string | Person
    employee: string | Person
    deniedReason?: string
    confirmedAt?: string
    deniedAt?: string
  } | null
  createdAt: string
  isRead?: boolean
  localId?: string
  pending?: boolean
}

type ConversationResponse = {
  match?: MatchRecord
  messages?: MessageRecord[]
}

type ResumeItem = {
  _id: string
  title: string
  url: string
  fileName: string
  mimeType: string
  size: number
  isVisibleOnProfile: boolean
  isFeatured: boolean
}

type SocketEventPayload = {
  matchId?: string
  message?: MessageRecord
  match?: MatchRecord
  userId?: string
  online?: boolean
  typing?: boolean
  userIds?: string[]
}

const ACTIVITY_DELAY_MS = 1000

function getPersonLabel(person?: Person) {
  if (!person) return "Connection"
  return person.name || person.username || "Connection"
}

function getPersonSubtitle(person?: Person) {
  if (!person) return "Matched"
  if (person.activeRole === "employer" || person.role === "employer") {
    return person.username ? `@${person.username}` : "Hiring"
  }
  return person.username ? `@${person.username}` : "Open to work"
}

function getInitials(person?: Person) {
  const label = getPersonLabel(person)
  return label
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function formatLastActivity(value?: string) {
  if (!value) return "New"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "New"

  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const diffDays = Math.round(
    (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" })
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })
}

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function isRecentlyActive(value?: string) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return Date.now() - date.getTime() < 90_000
}

function formatDayLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Today"
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

function formatSystemPreview(content?: string, maxChars = 120) {
  const text = content || "Match update"
  if (text.length <= maxChars) return text
  const slice = text.slice(0, maxChars)
  const lastSpace = slice.lastIndexOf(" ")
  if (lastSpace > Math.floor(maxChars * 0.4)) {
    return slice.slice(0, lastSpace) + "..."
  }
  return slice + "..."
}

function getMessageAttachment(message: MessageRecord) {
  const attachmentUrl = message.attachmentUrl?.trim() || ""
  const contentUrl = message.content?.trim() || ""
  const href = attachmentUrl || (message.type === "linkedin" ? contentUrl : "")
  const title =
    message.attachmentName?.trim() || message.content?.trim() || "Attachment"

  if (
    !href &&
    !message.attachmentName &&
    !message.attachmentUrl &&
    message.type !== "cv-share" &&
    message.type !== "linkedin"
  ) {
    return null
  }

  const isLink =
    Boolean(href && /^https?:\/\//i.test(href)) || message.type === "linkedin"

  return {
    href: href || undefined,
    title,
    subtitle: isLink
      ? href || "Shared link"
      : message.attachmentType === "portfolio"
        ? "Portfolio file"
        : "Resume file",
    icon: isLink ? "link" : "file",
  }
}

function getMatchUnreadCount(match: MatchRecord, userId?: string) {
  if (!userId) return 0
  const isEmployer = String(match.employer?._id) === userId
  return isEmployer ? match.unreadByEmployer || 0 : match.unreadByEmployee || 0
}

function isMatchDeletedForCurrentUser(match: MatchRecord, userId?: string) {
  if (!userId) return false

  if (String(match.employer?._id) === userId) {
    return Boolean(match.deletedAtByEmployer)
  }

  if (String(match.employee?._id) === userId) {
    return Boolean(match.deletedAtByEmployee)
  }

  return false
}

function isMatchClearedForCurrentUser(match: MatchRecord, userId?: string) {
  if (!userId) return false

  if (String(match.employer?._id) === userId) {
    return Boolean(match.clearedAtByEmployer)
  }

  if (String(match.employee?._id) === userId) {
    return Boolean(match.clearedAtByEmployee)
  }

  return false
}

function getMatchPreview(match: MatchRecord, userId?: string) {
  const isDeleted = isMatchDeletedForCurrentUser(match, userId)
  const isCleared = isMatchClearedForCurrentUser(match, userId)
  const clearCursor =
    String(match.employer?._id) === userId
      ? match.clearedAtByEmployer
      : String(match.employee?._id) === userId
        ? match.clearedAtByEmployee
        : undefined
  const lastMessageAt = match.lastMessageAt
    ? new Date(match.lastMessageAt).getTime()
    : 0
  const clearAt = clearCursor ? new Date(clearCursor).getTime() : 0

  if (isDeleted) return ""
  if (isCleared && clearAt && lastMessageAt <= clearAt) return ""
  return match.lastMessagePreview || ""
}

function getOtherParticipant(match: MatchRecord, userId?: string) {
  if (!userId) return match.employee
  return String(match.employer?._id) === userId
    ? match.employee
    : match.employer
}

function isParticipantOnline(
  participant: Person | undefined,
  onlineUsers: Set<string>,
) {
  return participant?._id ? onlineUsers.has(participant._id) : false
}

function upsertMatch(
  list: MatchRecord[],
  match: MatchRecord,
  currentUserId?: string,
) {
  const existing = list.find((item) => item._id === match._id)
  const next = list.filter((item) => item._id !== match._id)

  const isDeleted =
    currentUserId &&
    ((String(match.employer?._id || match.employer) === currentUserId &&
      match.deletedAtByEmployer) ||
      (String(match.employee?._id || match.employee) === currentUserId &&
        match.deletedAtByEmployee))

  const merged = existing
    ? {
        ...existing,
        ...match,
        lastMessagePreview: isDeleted
          ? undefined
          : (match.lastMessagePreview ?? existing.lastMessagePreview),
      }
    : match

  if (isDeleted) {
    merged.lastMessagePreview = undefined
  }

  next.unshift(merged)
  return next.sort((a, b) => {
    const aDeleted =
      currentUserId &&
      ((String(a.employer?._id || a.employer) === currentUserId &&
        a.deletedAtByEmployer) ||
        (String(a.employee?._id || a.employee) === currentUserId &&
          a.deletedAtByEmployee))

    const bDeleted =
      currentUserId &&
      ((String(b.employer?._id || b.employer) === currentUserId &&
        b.deletedAtByEmployer) ||
        (String(b.employee?._id || b.employee) === currentUserId &&
          b.deletedAtByEmployee))

    if (aDeleted && !bDeleted) return 1
    if (!aDeleted && bDeleted) return -1

    const aTime = new Date(a.lastMessageAt || a.matchedAt || 0).getTime()
    const bTime = new Date(b.lastMessageAt || b.matchedAt || 0).getTime()
    return bTime - aTime
  })
}

function messageSignature(message: MessageRecord) {
  return [
    message.match,
    String(message.sender?._id || ""),
    message.type,
    (message.content || "").trim(),
    (message.attachmentUrl || "").trim(),
    (message.attachmentName || "").trim(),
  ].join("|")
}

function dedupeMessagesById(list: MessageRecord[]) {
  const seen = new Set<string>()
  const result: MessageRecord[] = []

  for (const item of list) {
    if (!item?._id) {
      result.push(item)
      continue
    }

    if (seen.has(item._id)) {
      continue
    }

    seen.add(item._id)
    result.push(item)
  }

  return result
}

function appendMessage(list: MessageRecord[], message: MessageRecord) {
  if (list.some((item) => item._id === message._id)) {
    return list
  }

  if (!message.pending) {
    const pendingIndex = list.findIndex(
      (item) =>
        item.pending && messageSignature(item) === messageSignature(message),
    )

    if (pendingIndex !== -1) {
      const next = [...list]
      next[pendingIndex] = message
      return dedupeMessagesById(next)
    }
  }

  return [...list, message]
}

function replacePendingMessage(
  list: MessageRecord[],
  localId: string,
  message: MessageRecord,
) {
  const index = list.findIndex(
    (item) => item.localId === localId || item._id === message._id,
  )

  if (index === -1) {
    return appendMessage(list, message)
  }

  const next = [...list]
  next[index] = message
  return dedupeMessagesById(next)
}

function removePendingMessage(list: MessageRecord[], localId: string) {
  return list.filter((item) => item.localId !== localId)
}

function buildOptimisticMessage(params: {
  localId: string
  matchId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  senderRole: "employer" | "employee"
  type: MessageRecord["type"]
  content: string
  attachmentUrl?: string
  attachmentType?: MessageRecord["attachmentType"]
  attachmentName?: string
}) {
  return {
    _id: params.localId,
    localId: params.localId,
    pending: true,
    match: params.matchId,
    sender: {
      _id: params.senderId,
      name: params.senderName || "You",
      avatar: params.senderAvatar,
    },
    senderRole: params.senderRole,
    type: params.type,
    content: params.content,
    attachmentUrl: params.attachmentUrl,
    attachmentType: params.attachmentType,
    attachmentName: params.attachmentName,
    createdAt: new Date().toISOString(),
    isRead: false,
  } satisfies MessageRecord
}

function notifyMessagesUpdated() {
  try {
    window.dispatchEvent(new Event("swrk:messages-updated"))
  } catch {
    // ignore
  }
}

type MessagesPageContentProps = {
  initialMatchId?: string
  showListPane?: boolean
  showChatPane?: boolean
  showEmptyPane?: boolean
}

export function MessagesPageContent({
  initialMatchId = "",
  showListPane = true,
  showChatPane = true,
  showEmptyPane = false,
}: MessagesPageContentProps = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeMatchId, setActiveMatchId] = useState(initialMatchId)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [socketConnected, setSocketConnected] = useState(false)
  const [isCompactLayout, setIsCompactLayout] = useState(false)
  const [actionBusy, setActionBusy] = useState<
    "mark-read" | "mark-unread" | "delete" | "clear" | "report" | null
  >(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)
  const [resumeShareDialogOpen, setResumeShareDialogOpen] = useState(false)
  const [linkShareDialogOpen, setLinkShareDialogOpen] = useState(false)
  const [linkShareUrl, setLinkShareUrl] = useState("")
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [resumesLoading, setResumesLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const emojiWrapperRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const activeMatchIdRef = useRef("")
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )
  const fallbackPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )
  const typingPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )
  const typingActivityDelayRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const typingExpiryTimeoutsRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map())
  const messageViewportRef = useRef<HTMLDivElement | null>(null)
  const isAtBottomRef = useRef(true)
  const previousMatchIdRef = useRef("")

  const currentUserId = session?.user?.id

  const fetchMatches = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoadingMatches(true)
      }
      try {
        const response = await fetch("/api/matches?status=active&limit=100", {
          cache: "no-store",
        })
        const json = await response.json()
        if (!response.ok) {
          throw new Error(json?.error || "Failed to fetch matches")
        }

        const nextMatches = (json.matches || []) as MatchRecord[]
        const sortedMatches = nextMatches.sort((a, b) => {
          const aDeleted =
            (String(a.employer?._id || a.employer) === currentUserId &&
              a.deletedAtByEmployer) ||
            (String(a.employee?._id || a.employee) === currentUserId &&
              a.deletedAtByEmployee)

          const bDeleted =
            (String(b.employer?._id || b.employer) === currentUserId &&
              b.deletedAtByEmployer) ||
            (String(b.employee?._id || b.employee) === currentUserId &&
              b.deletedAtByEmployee)

          if (aDeleted && !bDeleted) return 1
          if (!aDeleted && bDeleted) return -1

          const aTime = new Date(a.lastMessageAt || a.matchedAt || 0).getTime()
          const bTime = new Date(b.lastMessageAt || b.matchedAt || 0).getTime()
          return bTime - aTime
        })
        setMatches(sortedMatches)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load matches")
        setMatches([])
      } finally {
        if (!options?.silent) {
          setLoadingMatches(false)
        }
      }
    },
    [currentUserId],
  )

  const fetchResumes = useCallback(async () => {
    setResumesLoading(true)
    try {
      const response = await fetch("/api/resumes", { cache: "no-store" })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json?.error || "Failed to load resumes")
      }

      setResumes((json.resumes || []) as ResumeItem[])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load resumes")
      setResumes([])
    } finally {
      setResumesLoading(false)
    }
  }, [])

  const fetchConversation = useCallback(
    async (matchId: string, options?: { silent?: boolean }) => {
      if (!matchId) {
        setMessages([])
        return
      }

      if (!options?.silent) {
        setLoadingMessages(true)
      }
      try {
        const response = await fetch(
          `/api/messages?matchId=${encodeURIComponent(matchId)}`,
          { cache: "no-store" },
        )
        const json = (await response.json()) as ConversationResponse

        if (!response.ok) {
          throw new Error(
            (json as { error?: string })?.error ||
              "Failed to load conversation",
          )
        }

        if (json.match) {
          setMatches((previous) =>
            upsertMatch(previous, json.match as MatchRecord, currentUserId),
          )
        }
        setShowJumpToLatest(false)
        setMessages(
          dedupeMessagesById((json.messages || []) as MessageRecord[]),
        )
        notifyMessagesUpdated()
      } catch (error) {
        console.error(error)
        toast.error("Failed to load conversation")
        setMessages([])
      } finally {
        if (!options?.silent) {
          setLoadingMessages(false)
        }
      }
    },
    [currentUserId],
  )

  useEffect(() => {
    if (status === "authenticated") {
      queueMicrotask(() => {
        void fetchMatches()
        void fetchResumes()
      })
    }
  }, [status, fetchMatches, fetchResumes])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)")

    const updateLayout = () => {
      setIsCompactLayout(mediaQuery.matches)
    }

    updateLayout()
    mediaQuery.addEventListener("change", updateLayout)

    return () => {
      mediaQuery.removeEventListener("change", updateLayout)
    }
  }, [])

  useEffect(() => {
    activeMatchIdRef.current = activeMatchId
  }, [activeMatchId])

  useEffect(() => {
    for (const timeout of typingExpiryTimeoutsRef.current.values()) {
      clearTimeout(timeout)
    }
    typingExpiryTimeoutsRef.current.clear()
  }, [activeMatchId])

  useEffect(() => {
    const handlePopState = () => {
      setTypingUsers(new Set())
      for (const timeout of typingExpiryTimeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      typingExpiryTimeoutsRef.current.clear()

      const nextMatchId =
        new URL(window.location.href).searchParams.get("matchId") || ""
      setActiveMatchId((previous) =>
        previous === nextMatchId ? previous : nextMatchId,
      )
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    const handleWindowBlur = () => {
      const matchId = activeMatchIdRef.current
      if (matchId) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }
        socketRef.current?.emit("typing:stop", { matchId })
        void fetch(`/api/matches/${matchId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typing: false }),
        })
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        const matchId = activeMatchIdRef.current
        if (matchId) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = null
          }
          socketRef.current?.emit("typing:stop", { matchId })
          void fetch(`/api/matches/${matchId}/typing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ typing: false }),
          })
        }
      }
    }

    window.addEventListener("blur", handleWindowBlur)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("blur", handleWindowBlur)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!activeMatchId) return

    queueMicrotask(() => {
      void fetchConversation(activeMatchId)
    })
  }, [activeMatchId, fetchConversation])

  useEffect(() => {
    if (!activeMatchId || status !== "authenticated") return

    const pollTypingState = async () => {
      try {
        const response = await fetch(`/api/matches/${activeMatchId}/typing`, {
          cache: "no-store",
        })
        const json = await response.json()

        if (!response.ok) return

        setMatches((previous) =>
          previous.map((match) =>
            match._id === activeMatchId
              ? {
                  ...match,
                  typingUsers: Array.isArray(json.typingUsers)
                    ? json.typingUsers
                    : [],
                  typingUpdatedAt: json.typingUpdatedAt || undefined,
                }
              : match,
          ),
        )
      } catch {
        // ignore typing poll failures
      }
    }

    // perform a single fetch to populate typing state; afterwards rely on socket events for real-time updates
    void pollTypingState()

    return () => {
      if (typingPollIntervalRef.current) {
        clearInterval(typingPollIntervalRef.current)
        typingPollIntervalRef.current = null
      }
    }
  }, [activeMatchId, status])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const viewport = messageViewportRef.current
    if (!viewport) return

    window.requestAnimationFrame(() => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior })
    })
  }, [])

  const delayActivity = useCallback(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ACTIVITY_DELAY_MS)
      }),
    [],
  )

  const queueTypingActivity = useCallback(
    (matchId: string, typing: boolean) => {
      if (!matchId) return

      if (typingActivityDelayRef.current) {
        clearTimeout(typingActivityDelayRef.current)
        typingActivityDelayRef.current = null
      }

      typingActivityDelayRef.current = setTimeout(() => {
        const socket = socketRef.current
        if (typing) {
          socket?.emit("typing:start", { matchId })
        } else {
          socket?.emit("typing:stop", { matchId })
        }

        void fetch(`/api/matches/${matchId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typing }),
        })

        typingActivityDelayRef.current = null
      }, ACTIVITY_DELAY_MS)
    },
    [],
  )

  const stopTypingNow = useCallback(
    (matchId: string) => {
      if (!matchId) return

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      queueTypingActivity(matchId, false)

      if (currentUserId) {
        setMatches((previous) =>
          previous.map((match) => {
            if (match._id !== matchId) return match

            return {
              ...match,
              typingUsers: (match.typingUsers || []).filter(
                (userId) => userId !== currentUserId,
              ),
              typingUpdatedAt: new Date().toISOString(),
            }
          }),
        )
      }
    },
    [currentUserId, queueTypingActivity],
  )

  const sendAttachmentMessage = useCallback(
    async (payload: {
      type: "cv-share" | "linkedin"
      content: string
      attachmentUrl: string
      attachmentName: string
      attachmentType: "cv" | "portfolio" | "other"
    }) => {
      if (!activeMatchId || sending) return false

      stopTypingNow(activeMatchId)

      const localId = `local-${globalThis.crypto.randomUUID()}`
      const activeMatchForSend = matches.find(
        (match) => match._id === activeMatchId,
      )
      const senderRole =
        activeMatchForSend &&
        currentUserId &&
        String(activeMatchForSend.employer._id) === currentUserId
          ? "employer"
          : "employee"
      const optimisticMessage = buildOptimisticMessage({
        localId,
        matchId: activeMatchId,
        senderId: currentUserId || localId,
        senderName: session?.user?.name || session?.user?.email || "You",
        senderAvatar:
          (session?.user as { image?: string; avatar?: string } | undefined)
            ?.avatar ||
          session?.user?.image ||
          undefined,
        senderRole,
        type: payload.type,
        content: payload.content,
        attachmentUrl: payload.attachmentUrl,
        attachmentName: payload.attachmentName,
        attachmentType: payload.attachmentType,
      })

      setSending(true)
      try {
        setMessages((previous) => appendMessage(previous, optimisticMessage))
        isAtBottomRef.current = true
        scrollToBottom("auto")
        await delayActivity()

        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: activeMatchId,
            type: payload.type,
            content: payload.content,
            attachmentUrl: payload.attachmentUrl,
            attachmentName: payload.attachmentName,
            attachmentType: payload.attachmentType,
          }),
        })

        const json = (await response.json()) as {
          error?: string
          message?: MessageRecord
          match?: MatchRecord
        }

        if (!response.ok) {
          throw new Error(json.error || "Failed to send message")
        }

        setMessageText("")

        if (json.message) {
          setMessages((previous) =>
            replacePendingMessage(previous, localId, json.message!),
          )
        }
        if (json.match) {
          setMatches((previous) =>
            upsertMatch(previous, json.match!, currentUserId),
          )
        }

        isAtBottomRef.current = true
        scrollToBottom("auto")
        notifyMessagesUpdated()
        return true
      } catch (error) {
        console.error(error)
        setMessages((previous) => removePendingMessage(previous, localId))
        toast.error("Failed to send message")
        return false
      } finally {
        setSending(false)
      }
    },
    [
      activeMatchId,
      currentUserId,
      delayActivity,
      matches,
      scrollToBottom,
      sending,
      session?.user,
      stopTypingNow,
    ],
  )

  useEffect(() => {
    if (status !== "authenticated") return

    const sendHeartbeat = async (online: boolean) => {
      try {
        await delayActivity()
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ online }),
          keepalive: true,
        })
      } catch {
        // ignore heartbeat failures
      }
    }

    void sendHeartbeat(true)

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    heartbeatIntervalRef.current = setInterval(() => {
      void sendHeartbeat(true)
    }, 30000)

    const handleVisibilityChange = () => {
      void sendHeartbeat(document.visibilityState !== "hidden")
    }

    const handleBeforeUnload = () => {
      void sendHeartbeat(false)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      void sendHeartbeat(false)
    }
  }, [delayActivity, status])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !activeMatchId) return

    socket.emit("conversation:join", { matchId: activeMatchId })

    return () => {
      socket.emit("conversation:leave", { matchId: activeMatchId })
    }
  }, [activeMatchId])

  useEffect(() => {
    let cancelled = false
    let socketCleanup: (() => void) | null = null

    const bootstrap = async () => {
      if (status !== "authenticated") return

      try {
        const socket = await getSocketClient()
        if (cancelled) return

        socketRef.current = socket

        const handleConnect = () => {
          setSocketConnected(true)
          if (activeMatchIdRef.current) {
            socket.emit("conversation:join", {
              matchId: activeMatchIdRef.current,
            })
          }
          void fetchMatches({ silent: true })
          if (activeMatchIdRef.current) {
            void fetchConversation(activeMatchIdRef.current, { silent: true })
          }
        }

        const handleDisconnect = () => {
          setSocketConnected(false)
        }

        const handlePresenceSnapshot = (payload: SocketEventPayload) => {
          if (!Array.isArray(payload.userIds)) return
          setOnlineUsers(new Set(payload.userIds))
        }

        const handleMessageNew = (payload: SocketEventPayload) => {
          if (!payload.matchId || !payload.message) return

          if (payload.matchId === activeMatchIdRef.current) {
            if (!isAtBottomRef.current) {
              setShowJumpToLatest(true)
            }
            setMessages((previous) => appendMessage(previous, payload.message!))
            notifyMessagesUpdated()
          }

          if (payload.match) {
            setMatches((previous) =>
              upsertMatch(
                previous,
                payload.match as MatchRecord,
                currentUserId,
              ),
            )
            notifyMessagesUpdated()
          }
        }

        const handleConversationUpdate = (payload: SocketEventPayload) => {
          if (payload.match) {
            setMatches((previous) =>
              upsertMatch(
                previous,
                payload.match as MatchRecord,
                currentUserId,
              ),
            )
            notifyMessagesUpdated()
          }
          if (payload.matchId === activeMatchIdRef.current) {
            void fetchConversation(payload.matchId, { silent: true })
          }
        }

        const handleInterviewUpdate = (payload: SocketEventPayload) => {
          if (payload.matchId !== activeMatchIdRef.current) return
          void fetchConversation(payload.matchId, { silent: true })
        }

        const handlePresenceUpdate = (payload: SocketEventPayload) => {
          if (!payload.userId) return
          setOnlineUsers((previous) => {
            const next = new Set(previous)
            if (payload.online) {
              next.add(payload.userId!)
            } else {
              next.delete(payload.userId!)
            }
            return next
          })
        }

        const handleTypingUpdate = (payload: SocketEventPayload) => {
          if (!payload.userId || !payload.matchId) return
          if (payload.matchId !== activeMatchIdRef.current) return

          const timeoutKey = `${payload.matchId}:${payload.userId}`
          const existingTimeout =
            typingExpiryTimeoutsRef.current.get(timeoutKey)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
            typingExpiryTimeoutsRef.current.delete(timeoutKey)
          }

          setTypingUsers((previous) => {
            const next = new Set(previous)
            if (payload.typing) {
              next.add(payload.userId!)

              const timeout = setTimeout(() => {
                setTypingUsers((current) => {
                  const cleaned = new Set(current)
                  cleaned.delete(payload.userId!)
                  return cleaned
                })
                typingExpiryTimeoutsRef.current.delete(timeoutKey)
              }, 2500)

              typingExpiryTimeoutsRef.current.set(timeoutKey, timeout)
            } else {
              next.delete(payload.userId!)
            }
            return next
          })
        }

        socket.off("connect", handleConnect)
        socket.off("disconnect", handleDisconnect)
        socket.off("presence:snapshot", handlePresenceSnapshot)
        socket.off("message:new", handleMessageNew)
        socket.off("conversation:update", handleConversationUpdate)
        socket.off("interview:update", handleInterviewUpdate)
        socket.off("presence:update", handlePresenceUpdate)
        socket.off("typing:update", handleTypingUpdate)

        socket.on("connect", handleConnect)
        socket.on("disconnect", handleDisconnect)
        socket.on("presence:snapshot", handlePresenceSnapshot)
        socket.on("message:new", handleMessageNew)
        socket.on("conversation:update", handleConversationUpdate)
        socket.on("interview:update", handleInterviewUpdate)
        socket.on("presence:update", handlePresenceUpdate)
        socket.on("typing:update", handleTypingUpdate)

        if (!socket.connected) {
          socket.connect()
        } else {
          handleConnect()
        }

        socketCleanup = () => {
          socket.off("connect", handleConnect)
          socket.off("disconnect", handleDisconnect)
          socket.off("presence:snapshot", handlePresenceSnapshot)
          socket.off("message:new", handleMessageNew)
          socket.off("conversation:update", handleConversationUpdate)
          socket.off("interview:update", handleInterviewUpdate)
          socket.off("presence:update", handlePresenceUpdate)
          socket.off("typing:update", handleTypingUpdate)
        }
      } catch (error) {
        console.error(error)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      socketCleanup?.()
      socketRef.current = null
    }
  }, [currentUserId, fetchConversation, fetchMatches, status])

  useEffect(() => {
    if (!emojiPickerOpen) return

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const wrapper = emojiWrapperRef.current
      if (!wrapper) return
      const target = e.target as Node | null
      if (!target) return
      if (!wrapper.contains(target)) {
        setEmojiPickerOpen(false)
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEmojiPickerOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("touchstart", onPointerDown)
    document.addEventListener("keydown", onKey)

    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("touchstart", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [emojiPickerOpen])

  useEffect(() => {
    // If socket is connected, we don't need to poll.
    if (socketConnected) {
      if (fallbackPollIntervalRef.current) {
        clearInterval(fallbackPollIntervalRef.current)
        fallbackPollIntervalRef.current = null
      }
      return
    }

    const pollActive = async () => {
      if (activeMatchIdRef.current) {
        try {
          await fetchConversation(activeMatchIdRef.current, { silent: true })
        } catch {
          // ignore
        }
      }
      try {
        await fetchMatches({ silent: true })
      } catch {
        // ignore
      }
    }

    void pollActive()
    fallbackPollIntervalRef.current = setInterval(pollActive, 1500)

    return () => {
      if (fallbackPollIntervalRef.current) {
        clearInterval(fallbackPollIntervalRef.current)
        fallbackPollIntervalRef.current = null
      }
    }
  }, [fetchConversation, fetchMatches, socketConnected])

  useEffect(() => {
    if (!activeMatchId) return

    if (previousMatchIdRef.current !== activeMatchId) {
      previousMatchIdRef.current = activeMatchId
      isAtBottomRef.current = true
      setShowJumpToLatest(false)
      scrollToBottom("auto")
      return
    }

    if (isAtBottomRef.current) {
      setShowJumpToLatest(false)
      scrollToBottom("auto")
    }
  }, [messages, activeMatchId, loadingMessages, scrollToBottom])

  useEffect(() => {
    const typingExpiryTimeouts = typingExpiryTimeoutsRef.current

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      if (typingActivityDelayRef.current) {
        clearTimeout(typingActivityDelayRef.current)
        typingActivityDelayRef.current = null
      }
      for (const timeout of typingExpiryTimeouts.values()) {
        clearTimeout(timeout)
      }
      typingExpiryTimeouts.clear()
      if (fallbackPollIntervalRef.current) {
        clearInterval(fallbackPollIntervalRef.current)
        fallbackPollIntervalRef.current = null
      }
      if (typingPollIntervalRef.current) {
        clearInterval(typingPollIntervalRef.current)
        typingPollIntervalRef.current = null
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      socketRef.current?.emit("typing:stop", {
        matchId: activeMatchIdRef.current,
      })
    }
  }, [])

  const activeMatches = useMemo(
    () =>
      matches.filter(
        (match) => !isMatchDeletedForCurrentUser(match, currentUserId),
      ),
    [currentUserId, matches],
  )

  const filteredMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return activeMatches

    return matches.filter((match) => {
      const other = getOtherParticipant(match, currentUserId)
      const preview = match.lastMessagePreview || ""
      return [getPersonLabel(other), getPersonSubtitle(other), preview]
        .join(" ")
        .toLowerCase()
        .includes(term)
    })
  }, [activeMatches, currentUserId, matches, searchTerm])

  const activeMatch =
    activeMatches.find((match) => match._id === activeMatchId) || null

  const otherParticipant = activeMatch
    ? getOtherParticipant(activeMatch, currentUserId)
    : null

  const activeUnread = activeMatch
    ? getMatchUnreadCount(activeMatch, currentUserId)
    : 0

  const typingFromMatch = Boolean(
    otherParticipant?._id &&
    activeMatch?.typingUsers?.includes(otherParticipant._id) &&
    isRecentlyActive(activeMatch?.typingUpdatedAt),
  )
  const typingFromSocket = Boolean(
    otherParticipant?._id ? typingUsers.has(otherParticipant._id) : false,
  )
  const typingNow = typingFromMatch || typingFromSocket

  const groupedMessages = useMemo(() => {
    const groups: Array<{
      type: "separator" | "message"
      id: string
      label?: string
      message?: MessageRecord
    }> = []

    let lastLabel = ""
    messages.forEach((message) => {
      const label = formatDayLabel(message.createdAt)
      if (label !== lastLabel) {
        groups.push({
          type: "separator",
          id: `${message._id}-separator`,
          label,
        })
        lastLabel = label
      }
      groups.push({ type: "message", id: message._id, message })
    })

    return groups
  }, [messages])

  const handleSelectMatch = useCallback(
    (matchId: string) => {
      setTypingUsers(new Set())
      for (const timeout of typingExpiryTimeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      typingExpiryTimeoutsRef.current.clear()

      setMatches((previous) =>
        previous.map((match) => {
          if (match._id !== matchId) return match

          const isEmployer = String(match.employer?._id) === currentUserId
          return isEmployer
            ? { ...match, unreadByEmployer: 0 }
            : { ...match, unreadByEmployee: 0 }
        }),
      )
      setActiveMatchId(matchId)
      router.push(`/dashboard/messages/${matchId}`)
    },
    [currentUserId, router],
  )

  const handleCloseMatch = useCallback(() => {
    setTypingUsers(new Set())
    for (const timeout of typingExpiryTimeoutsRef.current.values()) {
      clearTimeout(timeout)
    }
    typingExpiryTimeoutsRef.current.clear()

    setActiveMatchId("")
    router.push("/dashboard/messages")
  }, [router])

  const runChatAction = useCallback(
    async (
      action: "mark-read" | "mark-unread" | "delete" | "clear" | "report",
      payload?: { reason?: string; description?: string },
    ) => {
      if (!activeMatchId) return

      setActionBusy(action)
      try {
        const response = await fetch(`/api/matches/${activeMatchId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason: payload?.reason,
            description: payload?.description,
          }),
        })

        const json = (await response.json()) as {
          error?: string
          match?: MatchRecord
        }

        if (!response.ok) {
          throw new Error(json.error || "Failed to update chat")
        }

        if (action === "delete") {
          setDeleteConfirmOpen(false)
          handleCloseMatch()
          void fetchMatches({ silent: true })
          toast.success("Conversation deleted")
          return
        }

        if (action === "clear") {
          setClearConfirmOpen(false)
          setMessages([])
          setShowJumpToLatest(false)
          void fetchConversation(activeMatchId)
          void fetchMatches({ silent: true })
          toast.success("Conversation cleared")
          return
        }

        if (action === "report") {
          setReportDialogOpen(false)
          setReportReason("")
          setReportDescription("")
          toast.success("Report submitted")
          return
        }

        if (json.match) {
          setMatches((previous) =>
            upsertMatch(previous, json.match as MatchRecord, currentUserId),
          )
        }
        void fetchMatches({ silent: true })

        toast.success(
          action === "mark-read"
            ? "Conversation marked as read"
            : "Conversation marked as unread",
        )
      } catch (error) {
        console.error(error)
        toast.error("Failed to update chat")
      } finally {
        setActionBusy(null)
      }
    },
    [activeMatchId, fetchMatches, handleCloseMatch],
  )

  const handleTypingChange = (value: string) => {
    setMessageText(value)

    const matchId = activeMatchIdRef.current
    if (!matchId) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (!value.trim()) {
      stopTypingNow(matchId)
      return
    }

    queueTypingActivity(matchId, true)
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingNow(matchId)
    }, 1200)
  }

  const handleSendMessage = async () => {
    const content = messageText.trim()
    if (!content || !activeMatchId || sending) return

    stopTypingNow(activeMatchId)

    const localId = `local-${globalThis.crypto.randomUUID()}`
    const activeMatchForSend = matches.find(
      (match) => match._id === activeMatchId,
    )
    const senderRole =
      activeMatchForSend &&
      currentUserId &&
      String(activeMatchForSend.employer._id) === currentUserId
        ? "employer"
        : "employee"
    const optimisticMessage = buildOptimisticMessage({
      localId,
      matchId: activeMatchId,
      senderId: currentUserId || localId,
      senderName: session?.user?.name || session?.user?.email || "You",
      senderAvatar:
        (session?.user as { image?: string; avatar?: string } | undefined)
          ?.avatar ||
        session?.user?.image ||
        undefined,
      senderRole,
      type: "text",
      content,
    })

    try {
      setSending(true)
      setMessageText("")
      setMessages((previous) => appendMessage(previous, optimisticMessage))
      isAtBottomRef.current = true
      scrollToBottom("auto")
      await delayActivity()
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: activeMatchId, content }),
      })
      const json = (await response.json()) as {
        error?: string
        message?: MessageRecord
        match?: MatchRecord
      }

      if (!response.ok) {
        toast.error(json.error || "Failed to send message")
        setMessages((previous) => removePendingMessage(previous, localId))
        return
      }

      if (json.message) {
        setMessages((previous) =>
          replacePendingMessage(previous, localId, json.message!),
        )
      }
      if (json.match) {
        setMatches((previous) =>
          upsertMatch(previous, json.match!, currentUserId),
        )
      }
      isAtBottomRef.current = true
      scrollToBottom("auto")
      notifyMessagesUpdated()
    } catch (error) {
      console.error(error)
      setMessages((previous) => removePendingMessage(previous, localId))
      setMessageText(content)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const openResumeShareDialog = () => {
    void fetchResumes()
    setResumeShareDialogOpen(true)
  }

  const openLinkShareDialog = () => {
    const urlFromProfile =
      (session?.user as { linkedinUrl?: string } | undefined)?.linkedinUrl || ""
    setLinkShareUrl(urlFromProfile)
    setLinkShareDialogOpen(true)
  }

  const handleShareExistingResume = async (resume: ResumeItem) => {
    const title = resume.title.trim() || resume.fileName || "Resume"
    const sent = await sendAttachmentMessage({
      type: "cv-share",
      content: title,
      attachmentUrl: resume.url,
      attachmentName: title,
      attachmentType: "cv",
    })

    if (sent) {
      setResumeShareDialogOpen(false)
    }
  }

  const handleShareLinkedLink = async () => {
    const value = linkShareUrl.trim()
    if (!value) return

    try {
      const parsed = new URL(value)
      if (!/^https?:$/.test(parsed.protocol)) {
        toast.error("Please enter a valid http or https link")
        return
      }

      const sent = await sendAttachmentMessage({
        type: "linkedin",
        content: parsed.toString(),
        attachmentUrl: parsed.toString(),
        attachmentName: parsed.hostname.replace(/^www\./, ""),
        attachmentType: "other",
      })

      if (sent) {
        toast.success("Link shared")
        setLinkShareUrl("")
        setLinkShareDialogOpen(false)
      }
    } catch {
      toast.error("Please enter a valid link")
    }
  }

  if (status === "loading" || (status === "authenticated" && loadingMatches)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "authenticated" && !matches.length) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <Card className="border-border/60 bg-card/95 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">No matches yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your chats will appear here after two users match.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/swipe">Go swipe</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const shouldShowListPane = showListPane
  const shouldShowChatPane = showChatPane
  const visibleMatchCount = activeMatches.length
  const gridClassName = cn(
    "grid min-h-0 flex-1",
    shouldShowListPane && (shouldShowChatPane || showEmptyPane)
      ? "lg:grid-cols-[296px_minmax(0,1fr)]"
      : "lg:grid-cols-1",
  )

  return (
    <div className="h-full max-h-full overflow-hidden">
      <div className="mx-auto flex h-full max-h-full min-h-0 max-w-[1600px] flex-col gap-4">
        <div className={gridClassName}>
          {shouldShowListPane ? (
            <Card
              className={cn(
                "flex min-h-0 max-h-full flex-col overflow-hidden rounded-none py-0",
                isCompactLayout ? "h-full border-0" : "",
              )}
            >
              <div className="border-b border-border/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Active matches</h2>
                    <p className="text-sm text-muted-foreground">
                      {visibleMatchCount} conversations
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {activeUnread} unread
                  </Badge>
                </div>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search conversations"
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-1 p-4">
                  {filteredMatches.map((match) => {
                    const other = getOtherParticipant(match, currentUserId)
                    const active = match._id === activeMatchId
                    const unread = getMatchUnreadCount(match, currentUserId)
                    const online = isParticipantOnline(other, onlineUsers)

                    return (
                      <button
                        key={match._id}
                        type="button"
                        onClick={() => handleSelectMatch(match._id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                          active
                            ? "border border-primary/20 bg-primary/5"
                            : "border hover:bg-muted/60",
                        )}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-14 w-14 border border-border">
                            <AvatarImage
                              src={other?.avatar}
                              alt={getPersonLabel(other)}
                            />
                            <AvatarFallback>
                              {getInitials(other)}
                            </AvatarFallback>
                          </Avatar>
                          {online ? (
                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-medium text-foreground">
                              {getPersonLabel(other)}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatLastActivity(
                                match.lastMessageAt || match.matchedAt,
                              )}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="truncate text-sm text-muted-foreground">
                              {getMatchPreview(match, currentUserId) &&
                              getMatchPreview(match, currentUserId).length > 20
                                ? getMatchPreview(match, currentUserId).slice(
                                    0,
                                    20,
                                  ) + "..."
                                : getMatchPreview(match, currentUserId) ||
                                  "Say hello to start..."}
                            </p>
                            {unread > 0 ? (
                              <Badge className="shrink-0 rounded-full px-2 py-0.5 text-xs">
                                {unread}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </Card>
          ) : null}

          {shouldShowChatPane ? (
            <Card
              className={cn(
                "flex min-h-0 max-h-full flex-col overflow-hidden rounded-none gap-0 py-0",
                isCompactLayout ? "md:h-full h-[100dvh] border-0" : "",
              )}
            >
              {activeMatch && otherParticipant ? (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 sm:py-4 py-2 sm:px-5">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCloseMatch}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-11 w-11 border border-border">
                        <AvatarImage
                          src={otherParticipant.avatar}
                          alt={getPersonLabel(otherParticipant)}
                        />
                        <AvatarFallback>
                          {getInitials(otherParticipant)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold leading-none">
                            {getPersonLabel(otherParticipant)}
                          </h2>
                          {isParticipantOnline(
                            otherParticipant,
                            onlineUsers,
                          ) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                              Online
                            </span>
                          ) : null}

                          {shouldShowListPane && showEmptyPane ? (
                            <Card className="hidden min-h-0 max-h-full overflow-hidden rounded-none border-l-0 lg:flex" />
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getPersonSubtitle(otherParticipant)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/${otherParticipant.username || ""}`}>
                          <Info className="h-4 w-4" />
                        </Link>
                      </Button>
                      {currentUserId === activeMatch?.employer._id && (
                        <ScheduleInterviewModal
                          matchId={activeMatchId}
                          employeeName={otherParticipant.name || "Candidate"}
                          onInterviewScheduled={() => {
                            if (activeMatchId) {
                              void fetchConversation(activeMatchId)
                            }
                          }}
                        />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" type="button">
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => void runChatAction("mark-read")}
                            disabled={actionBusy !== null}
                          >
                            <MailOpen className="h-4 w-4" />
                            Mark as read
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void runChatAction("mark-unread")}
                            disabled={actionBusy !== null}
                          >
                            <Mail className="h-4 w-4" />
                            Mark as unread
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setReportDialogOpen(true)}
                            disabled={actionBusy !== null}
                          >
                            <Flag className="h-4 w-4" />
                            Report conversation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setClearConfirmOpen(true)}
                            disabled={actionBusy !== null}
                          >
                            <Eraser className="h-4 w-4" />
                            Clear conversation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteConfirmOpen(true)}
                            disabled={actionBusy !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete conversation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="relative min-h-0 flex-1">
                    <ScrollArea
                      className="min-h-0 h-full"
                      viewportRef={messageViewportRef}
                      onViewportScroll={(event) => {
                        const target = event.currentTarget
                        const distanceFromBottom =
                          target.scrollHeight -
                          target.scrollTop -
                          target.clientHeight
                        const atBottom = distanceFromBottom < 96
                        isAtBottomRef.current = atBottom
                        if (atBottom) {
                          setShowJumpToLatest(false)
                        }
                      }}
                    >
                      <div className="space-y-4 p-4 pb-24 sm:p-5 sm:pb-6">
                        {loadingMessages ? (
                          <div className="space-y-3">
                            <Skeleton className="h-20 w-3/4 rounded-2xl" />
                            <Skeleton className="ml-auto h-20 w-2/3 rounded-2xl" />
                            <Skeleton className="h-20 w-3/4 rounded-2xl" />
                          </div>
                        ) : groupedMessages.length > 0 ? (
                          <>
                            {groupedMessages.map((entry) => {
                              if (entry.type === "separator") {
                                return (
                                  <div
                                    key={entry.id}
                                    className="flex justify-center py-1"
                                  >
                                    <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
                                      {entry.label}
                                    </span>
                                  </div>
                                )
                              }

                              const message = entry.message!
                              const isOwnMessage =
                                String(message.sender?._id) === currentUserId

                              const attachment = getMessageAttachment(message)

                              if (attachment && message.type === "cv-share") {
                                return (
                                  <div
                                    key={entry.id}
                                    className={cn(
                                      "flex max-w-[82%] items-end gap-2 min-w-0",
                                      isOwnMessage
                                        ? "ml-auto flex-row-reverse"
                                        : "",
                                    )}
                                  >
                                    {!isOwnMessage && (
                                      <Avatar className="h-8 w-8 shrink-0 border border-border">
                                        <AvatarImage
                                          src={message.sender?.avatar}
                                          alt={getPersonLabel(message.sender)}
                                        />
                                        <AvatarFallback>
                                          {getInitials(message.sender)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}

                                    <div className="space-y-1 min-w-0">
                                      {attachment.href ? (
                                        <a
                                          href={attachment.href}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={cn(
                                            "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition-colors hover:bg-muted/50",
                                            isOwnMessage
                                              ? "border-primary/20 bg-primary/5 text-foreground"
                                              : "border-border bg-card text-foreground",
                                          )}
                                        >
                                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <FileText className="h-5 w-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                              {attachment.title}
                                            </p>
                                          </div>
                                        </a>
                                      ) : (
                                        <div
                                          className={cn(
                                            "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm",
                                            isOwnMessage
                                              ? "border-primary/20 bg-primary/5 text-foreground"
                                              : "border-border bg-card text-foreground",
                                          )}
                                        >
                                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <FileText className="h-5 w-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                              {attachment.title}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                      <div
                                        className={cn(
                                          "flex items-center gap-1 px-1 text-[10px] text-muted-foreground",
                                          isOwnMessage ? "justify-end" : "",
                                        )}
                                      >
                                        <span>
                                          {formatMessageTime(message.createdAt)}
                                        </span>
                                        {isOwnMessage ? (
                                          <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                )
                              }

                              if (attachment && message.type === "linkedin") {
                                return (
                                  <div
                                    key={entry.id}
                                    className={cn(
                                      "flex max-w-[82%] items-end gap-2 min-w-0",
                                      isOwnMessage
                                        ? "ml-auto flex-row-reverse"
                                        : "",
                                    )}
                                  >
                                    {!isOwnMessage && (
                                      <Avatar className="h-8 w-8 shrink-0 border border-border">
                                        <AvatarImage
                                          src={message.sender?.avatar}
                                          alt={getPersonLabel(message.sender)}
                                        />
                                        <AvatarFallback>
                                          {getInitials(message.sender)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}

                                    <div className="space-y-1 min-w-0">
                                      {attachment.href ? (
                                        <a
                                          href={attachment.href}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={cn(
                                            "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition-colors hover:bg-muted/50",
                                            isOwnMessage
                                              ? "border-primary/20 bg-primary/5 text-secondary"
                                              : "border-border bg-card text-foreground",
                                          )}
                                        >
                                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Link2 className="h-5 w-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                              {attachment.title}
                                            </p>
                                          </div>
                                        </a>
                                      ) : (
                                        <div
                                          className={cn(
                                            "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm",
                                            isOwnMessage
                                              ? "border-primary/20 bg-primary/5 text-secondary"
                                              : "border-border bg-card text-foreground",
                                          )}
                                        >
                                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Link2 className="h-5 w-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                              {attachment.title}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                      <div
                                        className={cn(
                                          "flex items-center gap-1 px-1 text-[10px] text-muted-foreground",
                                          isOwnMessage ? "justify-end" : "",
                                        )}
                                      >
                                        <span>
                                          {formatMessageTime(message.createdAt)}
                                        </span>
                                        {isOwnMessage ? (
                                          <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                )
                              }

                              if (message.type === "system") {
                                return (
                                  <div
                                    key={entry.id}
                                    className="flex justify-center"
                                  >
                                    <div className="rounded-full border border-border bg-muted/70 px-4 py-2 text-sm text-muted-foreground max-w-[70%]">
                                      {formatSystemPreview(message.content)}
                                    </div>
                                  </div>
                                )
                              }

                              if (
                                message.type === "interview" &&
                                message.interviewId
                              ) {
                                const interview = message.interview
                                const messageKind =
                                  message.interviewMessageType ||
                                  (interview && interview.status !== "scheduled"
                                    ? "response"
                                    : "scheduled")

                                if (
                                  messageKind === "scheduled" &&
                                  interview &&
                                  interview.status !== "scheduled"
                                ) {
                                  return null
                                }

                                return (
                                  <InterviewMessageComponent
                                    key={entry.id}
                                    interview={{
                                      _id: message.interviewId,
                                      title:
                                        interview?.title ||
                                        message.content ||
                                        "Interview",
                                      description: interview?.description || "",
                                      scheduledFor:
                                        interview?.scheduledFor ||
                                        new Date().toISOString(),
                                      timezone: interview?.timezone || "UTC",
                                      duration: interview?.duration || 60,
                                      status: interview?.status || "scheduled",
                                      interviewLink:
                                        interview?.interviewLink || "",
                                      createdBy:
                                        interview?.createdBy ||
                                        message.sender._id,
                                      employer: {
                                        _id:
                                          typeof interview?.employer ===
                                          "string"
                                            ? interview.employer
                                            : interview?.employer?._id ||
                                              activeMatch?.employer._id ||
                                              "",
                                        name:
                                          typeof interview?.employer ===
                                          "string"
                                            ? activeMatch?.employer.name || ""
                                            : interview?.employer?.name ||
                                              activeMatch?.employer.name ||
                                              "",
                                        companyName:
                                          typeof interview?.employer ===
                                          "string"
                                            ? activeMatch?.employer.username
                                            : interview?.employer &&
                                                typeof interview.employer !==
                                                  "string"
                                              ? interview.employer
                                                  .companyName ||
                                                activeMatch?.employer.username
                                              : activeMatch?.employer.username,
                                      },
                                      employee: {
                                        _id:
                                          typeof interview?.employee ===
                                          "string"
                                            ? interview.employee
                                            : interview?.employee?._id ||
                                              activeMatch?.employee._id ||
                                              "",
                                        name:
                                          typeof interview?.employee ===
                                          "string"
                                            ? activeMatch?.employee.name || ""
                                            : interview?.employee?.name ||
                                              activeMatch?.employee.name ||
                                              "",
                                        headline:
                                          typeof interview?.employee ===
                                          "string"
                                            ? activeMatch?.employee.username
                                            : interview?.employee &&
                                                typeof interview.employee !==
                                                  "string"
                                              ? interview.employee.headline ||
                                                activeMatch?.employee.username
                                              : activeMatch?.employee.username,
                                      },
                                      deniedReason: interview?.deniedReason,
                                    }}
                                    currentUserId={currentUserId || ""}
                                    messageSenderId={message.sender?._id}
                                    messageSender={message.sender}
                                    messageCreatedAt={message.createdAt}
                                    messageKind={messageKind}
                                  />
                                )
                              }

                              return (
                                <div
                                  key={entry.id}
                                  className={cn(
                                    "flex max-w-[82%] items-end gap-2 min-w-0",
                                    isOwnMessage
                                      ? "ml-auto flex-row-reverse"
                                      : "",
                                  )}
                                >
                                  {!isOwnMessage && (
                                    <Avatar className="h-8 w-8 shrink-0 border border-border">
                                      <AvatarImage
                                        src={message.sender?.avatar}
                                        alt={getPersonLabel(message.sender)}
                                      />
                                      <AvatarFallback>
                                        {getInitials(message.sender)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}

                                  <div className="space-y-1 min-w-0">
                                    <div
                                      className={cn(
                                        "rounded-2xl px-4 py-3 shadow-sm",
                                        isOwnMessage
                                          ? "rounded-br-sm bg-primary text-primary-foreground"
                                          : "rounded-bl-sm border border-border bg-card text-foreground",
                                      )}
                                    >
                                      <p className="text-sm leading-6 break-words break-all whitespace-pre-line">
                                        {message.content}
                                      </p>
                                    </div>
                                    <div
                                      className={cn(
                                        "flex items-center gap-1 px-1 text-[10px] text-muted-foreground",
                                        isOwnMessage ? "justify-end" : "",
                                      )}
                                    >
                                      <span>
                                        {formatMessageTime(message.createdAt)}
                                      </span>
                                      {isOwnMessage ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}

                            {typingNow && otherParticipant ? (
                              <div className="flex max-w-[82%] items-end gap-2">
                                <Avatar className="h-8 w-8 shrink-0 border border-border">
                                  <AvatarImage
                                    src={otherParticipant.avatar}
                                    alt={getPersonLabel(otherParticipant)}
                                  />
                                  <AvatarFallback>
                                    {getInitials(otherParticipant)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <div className="flex h-full min-h-[360px] items-center justify-center">
                            <div className="max-w-md rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-center">
                              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Sparkles className="h-7 w-7" />
                              </div>
                              <h3 className="mt-4 text-xl font-semibold">
                                Start the conversation
                              </h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Say hello to start the conversation.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {showJumpToLatest ? (
                      <div className="pointer-events-none absolute bottom-6 right-6 z-10">
                        <Button
                          type="button"
                          size="sm"
                          className="pointer-events-auto rounded-full shadow-lg"
                          onClick={() => {
                            isAtBottomRef.current = true
                            setShowJumpToLatest(false)
                            scrollToBottom("smooth")
                          }}
                        >
                          Jump to latest
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <footer className="border-t border-border/60 bg-background/95 pt-4 sm:pb-0 pb-4 px-4">
                    <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-3xl border border-border bg-muted/30 p-2 shadow-sm">
                      <div className="relative">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              className="shrink-0"
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            <DropdownMenuItem
                              onClick={() => openResumeShareDialog()}
                            >
                              Choose existing resume
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => fileInputRef.current?.click()}
                              disabled={fileUploading}
                            >
                              Upload new file
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openLinkShareDialog()}
                            >
                              Share link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.txt,.doc,.docx"
                          onChange={async (e) => {
                            const file = e.currentTarget.files?.[0]
                            if (!file || !activeMatchId) return

                            const allowed = [
                              "application/pdf",
                              "text/plain",
                              "application/msword",
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            ]
                            if (!allowed.includes(file.type)) {
                              toast.error("Invalid file type. Use PDF or TXT.")
                              e.currentTarget.value = ""
                              return
                            }

                            const maxSize = 5 * 1024 * 1024
                            if (file.size > maxSize) {
                              toast.error("File too large (max 5MB)")
                              e.currentTarget.value = ""
                              return
                            }

                            try {
                              setFileUploading(true)
                              const fd = new FormData()
                              fd.append("file", file)
                              fd.append("title", file.name)

                              const res = await fetch("/api/resumes", {
                                method: "POST",
                                body: fd,
                              })
                              const json = await res.json()
                              if (!res.ok) {
                                throw new Error(json.error || "Upload failed")
                              }

                              const url = json.resume?.url
                              if (!url) throw new Error("No url returned")

                              const sent = await sendAttachmentMessage({
                                type: "cv-share",
                                content: file.name,
                                attachmentUrl: url,
                                attachmentName: file.name,
                                attachmentType: "cv",
                              })

                              if (sent) {
                                toast.success("File shared")
                              }
                            } catch (err) {
                              console.error(err)
                              toast.error("Failed to share file")
                            } finally {
                              setFileUploading(false)
                              e.currentTarget.value = ""
                            }
                          }}
                        />

                        <Dialog
                          open={resumeShareDialogOpen}
                          onOpenChange={setResumeShareDialogOpen}
                        >
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Share a resume</DialogTitle>
                              <DialogDescription>
                                Choose one of your saved resumes to share as a
                                file card.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                              {resumesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : resumes.length > 0 ? (
                                resumes.map((resume) => (
                                  <button
                                    key={resume._id}
                                    type="button"
                                    onClick={() =>
                                      void handleShareExistingResume(resume)
                                    }
                                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50"
                                  >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-medium text-foreground">
                                        {resume.title}
                                      </p>
                                      <p className="truncate text-sm text-muted-foreground">
                                        {resume.fileName}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                                  No saved resumes found. Upload one in Resume
                                  settings first.
                                </div>
                              )}
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setResumeShareDialogOpen(false)
                                }}
                              >
                                Cancel
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={linkShareDialogOpen}
                          onOpenChange={setLinkShareDialogOpen}
                        >
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Share a link</DialogTitle>
                              <DialogDescription>
                                Paste a safe http or https URL. It will render
                                as a clickable link.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <Input
                                value={linkShareUrl}
                                onChange={(e) =>
                                  setLinkShareUrl(e.target.value)
                                }
                                placeholder="https://www.linkedin.com/in/your-profile"
                              />
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setLinkShareUrl("")
                                  setLinkShareDialogOpen(false)
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => void handleShareLinkedLink()}
                              >
                                Share
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <Textarea
                        ref={textareaRef}
                        value={messageText}
                        onChange={(event) =>
                          handleTypingChange(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            void handleSendMessage()
                          }
                        }}
                        onBlur={() => {
                          const matchId = activeMatchIdRef.current
                          if (matchId) {
                            stopTypingNow(matchId)
                          }
                        }}
                        placeholder="Type a message..."
                        rows={1}
                        className="min-h-[40px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                      />

                      <div className="flex items-center gap-1">
                        <div className="relative" ref={emojiWrapperRef}>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="shrink-0"
                            onClick={() => setEmojiPickerOpen((s) => !s)}
                          >
                            <Smile className="h-4 w-4" />
                          </Button>

                          {emojiPickerOpen ? (
                            <div className="absolute bottom-12 left-0 z-50 w-64 rounded-lg border border-border bg-card p-2 shadow-lg">
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  "😀",
                                  "😄",
                                  "😂",
                                  "😍",
                                  "👍",
                                  "🎉",
                                  "🔥",
                                  "🙌",
                                  "🙈",
                                  "🤝",
                                  "💼",
                                  "📄",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      const ta = textareaRef.current
                                      if (!ta) {
                                        setMessageText((prev) => prev + emoji)
                                      } else {
                                        const start =
                                          ta.selectionStart ?? ta.value.length
                                        const end = ta.selectionEnd ?? start
                                        const next =
                                          messageText.slice(0, start) +
                                          emoji +
                                          messageText.slice(end)
                                        setMessageText(next)
                                        requestAnimationFrame(() => {
                                          ta.focus()
                                          const pos = start + emoji.length
                                          ta.setSelectionRange(pos, pos)
                                        })
                                      }
                                      setEmojiPickerOpen(false)
                                    }}
                                    className="rounded-md px-2 py-1 text-lg hover:bg-muted/50"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <div className="mt-2 text-center text-xs text-muted-foreground">
                                {typeof navigator !== "undefined" &&
                                /Mac|iPhone|iPad/i.test(navigator.userAgent) ? (
                                  <span>
                                    Tip: press{" "}
                                    <span className="font-semibold">
                                      Control + Command + Space
                                    </span>{" "}
                                    for system emojis
                                  </span>
                                ) : (
                                  <span>Use emoji picker above</span>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <Button
                          type="button"
                          onClick={() => void handleSendMessage()}
                          disabled={sending || !messageText.trim()}
                          className="h-11 rounded-2xl px-4"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="ml-2 hidden sm:inline">Send</span>
                        </Button>
                      </div>
                    </div>
                  </footer>
                </>
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                  <Card className="max-w-xl border-border/60 bg-card/95 p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold">
                      Pick a match to chat
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Select a real match from the left to start messaging.
                    </p>
                    <Button asChild className="mt-6">
                      <Link href="/dashboard/swipe">Find more matches</Link>
                    </Button>
                  </Card>
                </div>
              )}
            </Card>
          ) : null}
        </div>

        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the thread from your inbox. The other person can
                still keep their copy.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionBusy === "delete"}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => void runChatAction("delete")}
                disabled={actionBusy === "delete"}
              >
                {actionBusy === "delete" ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes all messages from this conversation. Both you and
                the other person can still see that you matched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionBusy === "clear"}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void runChatAction("clear")}
                disabled={actionBusy === "clear"}
              >
                {actionBusy === "clear" ? "Clearing..." : "Clear"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Report conversation</DialogTitle>
              <DialogDescription>
                Send this chat to the moderation queue for review.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Reason</p>
                <Input
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="Spam, harassment, scam, abuse..."
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Details</p>
                <Textarea
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  placeholder="Add context for the moderation team"
                  rows={5}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setReportDialogOpen(false)}
                disabled={actionBusy === "report"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() =>
                  void runChatAction("report", {
                    reason: reportReason,
                    description: reportDescription,
                  })
                }
                disabled={!reportReason.trim() || actionBusy === "report"}
              >
                {actionBusy === "report" ? "Submitting..." : "Submit report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MessagesPageContent showChatPane={false} showEmptyPane />
    </Suspense>
  )
}
