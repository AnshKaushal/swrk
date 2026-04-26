"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Check, X, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function debounce(
  func: (usernameToCheck: string) => Promise<void>,
  wait: number,
): (usernameToCheck: string) => void {
  let timeout: NodeJS.Timeout;
  return (usernameToCheck: string) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(usernameToCheck), wait);
  };
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // Username validation
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Hydrate session data
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setStep(session.user.onboardingStep || 1);
      setName(session.user.name || "");
      setAvatar(session.user.image || "");
      setUsername(session.user.username || "");
      setRole(session.user.role || "");
    } else if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [session, status, router]);

  const checkUsernameAvailability = useCallback(
    debounce(async (usernameToCheck: string) => {
      if (!usernameToCheck || usernameToCheck.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(usernameToCheck)}`,
        );
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch (error) {
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    }, 500),
    [],
  );

  const handleUsernameChange = (value: string) => {
    const safeValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(safeValue);
    setUsernameAvailable(null);
    checkUsernameAvailability(safeValue);
  };

  const handleAvatarUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setAvatar(data.url);
      toast.success("Profile picture uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload profile picture");
    }
    setLoading(false);
  };

  const handleStepSubmit = async (
    targetStep: number,
    payload: any,
    sessionUpdates: any,
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, step: targetStep }),
      });
      if (!res.ok) throw new Error("Update failed");

      await update({ ...sessionUpdates, onboardingStep: targetStep });

      if (targetStep === 4) {
        toast.success("Profile completed successfully! Welcome to Swrk!");
        router.push("/dashboard");
      } else {
        setStep(targetStep);
        toast.success("Saved successfully!");
      }
    } catch (err) {
      toast.error("Failed to save information");
    }
    setLoading(false);
  };

  const onNextStep1 = () =>
    handleStepSubmit(
      2,
      { name, username, avatar },
      { name, username, image: avatar },
    );
  const onNextStep2 = () => handleStepSubmit(3, { role }, { role });
  const onNextStep3 = () =>
    handleStepSubmit(
      4,
      { phone, dateOfBirth, gender },
      { onboardingCompleted: true },
    );

  const getAvatarFallback = () => (name ? name.charAt(0).toUpperCase() : "U");

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Design Banner */}
      <div className="relative hidden w-1/2 lg:flex overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&auto=format&fit=crop"
          alt="Onboarding Background"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full w-full">
          <Link href="/">
            <img src="/swrk.svg" alt="Swrk Logo" className="h-10 opacity-90" />
          </Link>
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight">
              Your Career <br />
              Starts Here.
            </h1>
            <p className="text-xl text-white/80 max-w-md">
              Join Swrk and connect with top employers and talent seamlessly
              through a profile that truly represents you.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold">{step}/3</div>
              <div className="text-sm font-medium text-white/60 tracking-wider uppercase">
                Steps
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                2<span className="text-xl">m</span>
              </div>
              <div className="text-sm font-medium text-white/60 tracking-wider uppercase">
                Setup
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {step === 1 && "Personal Info"}
              {step === 2 && "Choose Your Role"}
              {step === 3 && "Final Details (Optional)"}
            </h2>
            <p className="text-muted-foreground">
              {step === 1 && "Let's start with the basics to identify you."}
              {step === 2 && "How will you be using Swrk?"}
              {step === 3 &&
                "Tell us a bit more about yourself to help with matching."}
            </p>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${step >= i ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-3xl">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
                <p
                  className="text-sm font-medium text-primary hover:underline cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Picture
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="h-12 bg-muted/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <div className="relative">
                    <Input
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="johndoe"
                      className={`h-12 bg-muted/50 border-none pl-10 ${
                        usernameAvailable === true
                          ? "ring-2 ring-green-500/50"
                          : usernameAvailable === false
                            ? "ring-2 ring-destructive/50"
                            : ""
                      }`}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      @
                    </span>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingUsername && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!checkingUsername && usernameAvailable === true && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {usernameAvailable === false && (
                    <p className="text-xs text-destructive font-medium mt-1">
                      Username is already taken
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={onNextStep1}
                className="w-full h-12 text-base font-bold"
                disabled={
                  loading || !name || !username || usernameAvailable === false
                }
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Continue to Next Step"
                )}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="grid grid-cols-1 gap-4"
              >
                {[
                  {
                    id: "job-seeker",
                    label: "I'm looking for a job",
                    desc: "Find companies and apply to roles",
                  },
                  {
                    id: "employer",
                    label: "I'm hiring",
                    desc: "Post jobs and find top talent",
                  },
                  {
                    id: "both",
                    label: "Both",
                    desc: "Open to opportunities and also hiring",
                  },
                ].map((r) => (
                  <div key={r.id}>
                    <RadioGroupItem
                      value={r.id}
                      id={r.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={r.id}
                      className="flex flex-col rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <span className="text-base font-bold">{r.label}</span>
                      <span className="text-sm text-muted-foreground mt-1">
                        {r.desc}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-12 w-12 p-0 shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onNextStep2}
                  className="h-12 flex-1 text-base font-bold"
                  disabled={loading || !role}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continue to Final Step"
                  )}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="h-12 bg-muted/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    type="date"
                    className="h-12 bg-muted/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-12 bg-muted/50 border-none">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-12 w-12 p-0 shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onNextStep3}
                  className="h-12 flex-1 text-base font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Complete Profile"
                  )}
                  {!loading && <Check className="ml-2 h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
