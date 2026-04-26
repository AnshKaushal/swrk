"use client"
import * as React from "react"
import Link from "next/link"
import { Menu, X, User, Settings, LogOut, UserCircle } from "lucide-react"
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

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = React.useState(false)

  if (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname.includes("/onboarding")
  ) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const getAvatarUrl = () => {
    if (session?.user?.image) {
      return session.user.image
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
            <ModeToggle />

            {status === "authenticated" && session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
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
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:block">
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
              </div>
            )}

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
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] px-4"
              >
                <div className="flex flex-col gap-6 mt-8">
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
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    {status === "authenticated" && session?.user ? (
                      <>
                        <div className="flex items-center gap-3 px-2 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={getAvatarUrl()}
                              alt={session.user.name || "User"}
                            />
                            <AvatarFallback className="text-xs">
                              {getAvatarFallback()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium">
                              {session.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            asChild
                            className="justify-start"
                          >
                            <Link href={`/${session.user.username || ""}`}>
                              <UserCircle className="mr-2 h-4 w-4" />
                              Profile
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            asChild
                            className="justify-start"
                          >
                            <Link href="/settings">
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/signin">Sign In</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/signup">Sign Up</Link>
                        </Button>
                      </>
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
