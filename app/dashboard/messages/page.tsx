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
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { io, type Socket } from "socket.io-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  Circle,
  Info,
  Loader2,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Smile,
  Video,
  Phone,
  Sparkles,
  CheckCheck,
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
}

type MessageRecord = {
  _id: string
  match: string
  sender: Person
  senderRole: "employer" | "employee"
  type: "text" | "starter" | "cv-share" | "linkedin" | "interview" | "system"
  content?: string
  interviewId?: string
  createdAt: string
  isRead?: boolean
}

type ConversationResponse = {
  match?: MatchRecord
  messages?: MessageRecord[]
}

type SocketEventPayload = {
  matchId?: string
  message?: MessageRecord
  match?: MatchRecord
  userId?: string
  online?: boolean
}

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

function getMatchUnreadCount(match: MatchRecord, userId?: string) {
  if (!userId) return 0
  const isEmployer = String(match.employer?._id) === userId
  return isEmployer ? match.unreadByEmployer || 0 : match.unreadByEmployee || 0
}

function getOtherParticipant(match: MatchRecord, userId?: string) {
  if (!userId) return match.employee
  return String(match.employer?._id) === userId
    ? match.employee
    : match.employer
}

function upsertMatch(list: MatchRecord[], match: MatchRecord) {
  const next = list.filter((item) => item._id !== match._id)
  next.unshift(match)
  return next.sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.matchedAt || 0).getTime()
    const bTime = new Date(b.lastMessageAt || b.matchedAt || 0).getTime()
    return bTime - aTime
  })
}

function appendMessage(list: MessageRecord[], message: MessageRecord) {
  if (list.some((item) => item._id === message._id)) {
    return list
  }
  return [...list, message]
}

function notifyMessagesUpdated() {
  try {
    window.dispatchEvent(new Event("swrk:messages-updated"))
  } catch {
    // ignore
  }
}

function MessagesPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeMatchId, setActiveMatchId] = useState("")
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [socketConnected, setSocketConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const socketRef = useRef<Socket | null>(null)
  const activeMatchIdRef = useRef("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const currentUserId = session?.user?.id
  const initialMatchId = searchParams?.get("matchId") || ""

  const fetchMatches = useCallback(async () => {
    setLoadingMatches(true)
    try {
      const response = await fetch("/api/matches?status=active&limit=100", {
        cache: "no-store",
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json?.error || "Failed to fetch matches")
      }

      const nextMatches = (json.matches || []) as MatchRecord[]
      setMatches(nextMatches)

      const preferredMatchId =
        initialMatchId &&
        nextMatches.some((match) => match._id === initialMatchId)
          ? initialMatchId
          : nextMatches[0]?._id || ""

      setActiveMatchId((previous) => previous || preferredMatchId)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load matches")
      setMatches([])
    } finally {
      setLoadingMatches(false)
    }
  }, [initialMatchId])

  const fetchConversation = useCallback(async (matchId: string) => {
    if (!matchId) {
      setMessages([])
      return
    }

    setLoadingMessages(true)
    try {
      const response = await fetch(
        `/api/messages?matchId=${encodeURIComponent(matchId)}`,
        { cache: "no-store" },
      )
      const json = (await response.json()) as ConversationResponse

      if (!response.ok) {
        throw new Error(
          (json as { error?: string })?.error || "Failed to load conversation",
        )
      }

      if (json.match) {
        setMatches((previous) =>
          upsertMatch(previous, json.match as MatchRecord),
        )
      }
      setMessages((json.messages || []) as MessageRecord[])
      notifyMessagesUpdated()
    } catch (error) {
      console.error(error)
      toast.error("Failed to load conversation")
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      void fetchMatches()
    }
  }, [status, fetchMatches])

  useEffect(() => {
    activeMatchIdRef.current = activeMatchId
  }, [activeMatchId])

  useEffect(() => {
    void fetchConversation(activeMatchId)
  }, [activeMatchId, fetchConversation])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (status !== "authenticated") return

      try {
        await fetch("/api/socket", { cache: "no-store" })
        if (cancelled) return

        const socket = io({
          path: "/socket.io",
          transports: ["websocket", "polling"],
          withCredentials: true,
        })

        socketRef.current = socket

        socket.on("connect", () => {
          setSocketConnected(true)
        })

        socket.on("disconnect", () => {
          setSocketConnected(false)
        })

        socket.on("message:new", (payload: SocketEventPayload) => {
          if (!payload.matchId || !payload.message) return

          if (payload.matchId === activeMatchIdRef.current) {
            setMessages((previous) => appendMessage(previous, payload.message!))
            notifyMessagesUpdated()
          }

          if (payload.match) {
            setMatches((previous) =>
              upsertMatch(previous, payload.match as MatchRecord),
            )
            notifyMessagesUpdated()
          }
        })

        socket.on("conversation:update", (payload: SocketEventPayload) => {
          if (payload.match) {
            setMatches((previous) =>
              upsertMatch(previous, payload.match as MatchRecord),
            )
            notifyMessagesUpdated()
          }
          if (payload.matchId === activeMatchIdRef.current) {
            void fetchConversation(payload.matchId)
          }
        })

        socket.on("presence:update", (payload: SocketEventPayload) => {
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
        })
      } catch (error) {
        console.error(error)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [fetchConversation, status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeMatchId])

  const filteredMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return matches

    return matches.filter((match) => {
      const other = getOtherParticipant(match, currentUserId)
      const preview = match.lastMessagePreview || ""
      return [getPersonLabel(other), getPersonSubtitle(other), preview]
        .join(" ")
        .toLowerCase()
        .includes(term)
    })
  }, [currentUserId, matches, searchTerm])

  const activeMatch = useMemo(
    () => matches.find((match) => match._id === activeMatchId) || null,
    [activeMatchId, matches],
  )

  const otherParticipant = activeMatch
    ? getOtherParticipant(activeMatch, currentUserId)
    : null

  const activeUnread = activeMatch
    ? getMatchUnreadCount(activeMatch, currentUserId)
    : 0

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

  const handleSelectMatch = (matchId: string) => {
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
    router.replace(`/dashboard/messages?matchId=${matchId}`)
  }

  const handleSendMessage = async () => {
    const content = messageText.trim()
    if (!content || !activeMatchId || sending) return

    try {
      setSending(true)
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
        return
      }

      setMessageText("")
      if (json.message) {
        setMessages((previous) => appendMessage(previous, json.message!))
      }
      if (json.match) {
        setMatches((previous) => upsertMatch(previous, json.match!))
      }
      notifyMessagesUpdated()
    } catch (error) {
      console.error(error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
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
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border/60 bg-card/95 p-8 text-center shadow-sm">
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

  return (
    <div className="h-full p-4 sm:p-6">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="flex min-h-0 flex-col overflow-hidden border-border/60 bg-card/95 shadow-sm">
            <div className="border-b border-border/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Active matches</h2>
                  <p className="text-sm text-muted-foreground">
                    {matches.length} conversations
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
              <div className="space-y-1 p-2">
                {filteredMatches.map((match) => {
                  const other = getOtherParticipant(match, currentUserId)
                  const active = match._id === activeMatchId
                  const unread = getMatchUnreadCount(match, currentUserId)
                  const online = other?._id ? onlineUsers.has(other._id) : false

                  return (
                    <button
                      key={match._id}
                      type="button"
                      onClick={() => handleSelectMatch(match._id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                        active
                          ? "border border-primary/20 bg-primary/5"
                          : "hover:bg-muted/60",
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-14 w-14 border border-border">
                          <AvatarImage
                            src={other?.avatar}
                            alt={getPersonLabel(other)}
                          />
                          <AvatarFallback>{getInitials(other)}</AvatarFallback>
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
                        <p className="truncate text-sm text-primary">
                          {getPersonSubtitle(other)}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="truncate text-sm text-muted-foreground">
                            {match.lastMessagePreview ||
                              "Say hello to start the conversation"}
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

          <Card className="flex min-h-0 flex-col overflow-hidden border-border/60 bg-card/95 shadow-sm">
            {activeMatch && otherParticipant ? (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => router.push("/dashboard")}
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
                        {onlineUsers.has(otherParticipant._id) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                            Online
                          </span>
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
                    <Button variant="ghost" size="icon" type="button">
                      <Phone className="h-4 w-4" />
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
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1 bg-gradient-to-b from-muted/20 to-background/20">
                  <div className="space-y-4 p-4 sm:p-5">
                    {loadingMessages ? (
                      <div className="space-y-3">
                        <Skeleton className="h-20 w-3/4 rounded-2xl" />
                        <Skeleton className="ml-auto h-20 w-2/3 rounded-2xl" />
                        <Skeleton className="h-20 w-3/4 rounded-2xl" />
                      </div>
                    ) : groupedMessages.length > 0 ? (
                      groupedMessages.map((entry) => {
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

                        if (message.type === "system") {
                          return (
                            <div key={entry.id} className="flex justify-center">
                              <div className="rounded-full border border-border bg-muted/70 px-4 py-2 text-sm text-muted-foreground">
                                {message.content || "Match update"}
                              </div>
                            </div>
                          )
                        }

                        if (
                          message.type === "interview" &&
                          message.interviewId
                        ) {
                          return (
                            <div
                              key={entry.id}
                              className="flex max-w-full justify-center mb-4"
                            >
                              <div className="w-full max-w-2xl">
                                <InterviewMessageComponent
                                  interview={{
                                    _id: message.interviewId,
                                    title: message.content || "Interview",
                                    description: "",
                                    scheduledFor: new Date().toISOString(),
                                    timezone: "UTC",
                                    duration: 60,
                                    status: "scheduled",
                                    interviewLink: "",
                                    createdBy: message.sender._id,
                                    employer: {
                                      _id: activeMatch?.employer._id || "",
                                      name: activeMatch?.employer.name || "",
                                      companyName:
                                        activeMatch?.employer.username,
                                    },
                                    employee: {
                                      _id: activeMatch?.employee._id || "",
                                      name: activeMatch?.employee.name || "",
                                      headline: activeMatch?.employee.username,
                                    },
                                  }}
                                  currentUserId={currentUserId || ""}
                                />
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={entry.id}
                            className={cn(
                              "flex max-w-[82%] items-end gap-2",
                              isOwnMessage ? "ml-auto flex-row-reverse" : "",
                            )}
                          >
                            <Avatar className="h-8 w-8 shrink-0 border border-border">
                              <AvatarImage
                                src={message.sender?.avatar}
                                alt={getPersonLabel(message.sender)}
                              />
                              <AvatarFallback>
                                {getInitials(message.sender)}
                              </AvatarFallback>
                            </Avatar>

                            <div
                              className={cn(
                                "space-y-1",
                                isOwnMessage ? "items-end text-right" : "",
                              )}
                            >
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-3 shadow-sm",
                                  isOwnMessage
                                    ? "rounded-br-sm bg-primary text-primary-foreground"
                                    : "rounded-bl-sm border border-border bg-card text-foreground",
                                )}
                              >
                                <p className="whitespace-pre-wrap text-sm leading-6">
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
                      })
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
                            Send a real message to open this match thread.
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                <footer className="border-t border-border/60 bg-background/95 p-3 sm:p-4">
                  <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-3xl border border-border bg-muted/30 p-2 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>

                    <Textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault()
                          void handleSendMessage()
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="min-h-[48px] flex-1 resize-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0"
                    />

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="shrink-0"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
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
        </div>
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
      <MessagesPageContent />
    </Suspense>
  )
}
