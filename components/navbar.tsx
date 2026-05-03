"use client"
import * as React from "react"
import Link from "next/link"
import {
  Menu,
  X,
  Settings,
  LogOut,
  UserCircle,
  SubscriptIcon,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/theme-toggle"
import { usePathname } from "next/navigation"
import { IconDashboard } from "@tabler/icons-react"

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#trusted-by", label: "Trusted By" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about-us", label: "About Us" },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status, update } = useSession()
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (!update) return
    const handler = () => {
      try {
        update()
      } catch (err) {
        console.warn("session update listener failed", err)
      }
    }
    window.addEventListener("swrk:session-updated", handler)
    return () => window.removeEventListener("swrk:session-updated", handler)
  }, [update])

  if (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname.includes("/onboarding") ||
    pathname.includes("/dashboard") ||
    pathname.includes("/settings")
  ) {
    return null
  }

  if (status === "loading") {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/10 backdrop-blur">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-muted/40" />
            </div>
            <div className="hidden md:flex flex-1 justify-center items-center gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  className="h-4 w-16 rounded-full bg-muted/40"
                />
              ))}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-muted/40" />
              <div className="h-10 w-10 rounded-full bg-muted/40" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const getAvatarUrl = () => {
    if (session?.user?.avatar) {
      return session.user.avatar
    }
    if (session?.user?.name) {
      const firstLetter = session.user.name.charAt(0).toUpperCase()
      return `https://dummyimage.com/200x200/0a0a0a/efefef?text=${firstLetter}`
    }
    return `https://dummyimage.com/200x200/0a0a0a/efefef?text=U`
  }

  const getAvatarFallback = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/10 backdrop-blur">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl flex-shrink-0"
          >
            <img
              src="/swrk.svg"
              alt="Swrk Logo"
              className="h-10 w-10 object-contain"
            />
          </Link>

          <div className="hidden md:flex flex-1 justify-center items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden md:block">
              <ModeToggle />
            </div>

            <div className="hidden md:block">
              {status === "authenticated" && session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage
                          src={getAvatarUrl()}
                          alt={session.user.name || "User"}
                        />
                        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/${session.user.username || ""}`}
                        className="cursor-pointer"
                      >
                        <UserCircle className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <IconDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings/subscription"
                        className="cursor-pointer"
                      >
                        <SubscriptIcon className="h-4 w-4" />
                        <span>Manage Subscription</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
              )}
            </div>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTitle className="sr-only">Nav menu</SheetTitle>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost">
                  {isOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col justify-between h-full gap-6 mt-8">
                  <div className="flex flex-col gap-6 px-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-base font-medium transition-colors hover:text-foreground text-muted-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 py-4 border-t">
                    {status === "authenticated" && session?.user ? (
                      <div className="flex items-center justify-between md:hidden px-4">
                        <ModeToggle />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className="relative h-10 w-10 rounded-full bg-secondary">
                              <Avatar className="h-8 w-8 border">
                                <AvatarImage
                                  src={getAvatarUrl()}
                                  alt={session.user.name || "User"}
                                />
                                <AvatarFallback className="text-xs">
                                  {getAvatarFallback()}
                                </AvatarFallback>
                              </Avatar>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-56"
                            align="end"
                            forceMount
                          >
                            <DropdownMenuLabel className="font-normal">
                              <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                  {session.user.name}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                  {session.user.email}
                                </p>
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${session.user.username || ""}`}
                                className="cursor-pointer"
                              >
                                <UserCircle className="h-4 w-4" />
                                <span>Profile</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href="/dashboard"
                                className="cursor-pointer"
                              >
                                <IconDashboard className="h-4 w-4" />
                                <span>Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href="/settings/subscription"
                                className="cursor-pointer"
                              >
                                <SubscriptIcon className="h-4 w-4" />
                                <span>Manage Subscription</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/settings" className="cursor-pointer">
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={handleSignOut}
                              className="cursor-pointer"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Log out</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <div className="px-4 flex flex-col gap-2">
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/signin">Sign In</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/signup">Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
