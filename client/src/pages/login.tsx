import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bot, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

function RuleItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      )}
      <span className={met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
        {text}
      </span>
    </div>
  );
}

function validate(username: string, password: string, isRegister: boolean) {
  const errors: Record<string, string> = {};
  if (isRegister) {
    if (username.length < 3) errors.username = "Username must be at least 3 characters";
    else if (username.length > 20) errors.username = "Username must be 20 characters or less";
    else if (!/^[a-zA-Z0-9]+$/.test(username)) errors.username = "Username can only contain letters (A-Z) and numbers (0-9)";

    if (password.length < 6) errors.password = "Password must be at least 6 characters";
    else if (!/[a-zA-Z]/.test(password)) errors.password = "Password must contain at least one letter";
    else if (!/[0-9]/.test(password)) errors.password = "Password must contain at least one number";
  }
  return errors;
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const login = useLogin();
  const register = useRegister();
  const mutation = mode === "login" ? login : register;
  const isRegister = mode === "register";

  const passwordRules = isRegister ? [
    { met: password.length >= 6,        text: "At least 6 characters" },
    { met: /[a-zA-Z]/.test(password),   text: "At least one letter (A-Z)" },
    { met: /[0-9]/.test(password),      text: "At least one number (0-9)" },
  ] : [];

  const usernameRules = isRegister ? [
    { met: username.length >= 3 && username.length <= 20, text: "Between 3 and 20 characters" },
    { met: /^[a-zA-Z0-9]*$/.test(username) && username.length > 0, text: "Letters and numbers only (no spaces or symbols)" },
  ] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (isRegister) {
      const errors = validate(username, password, true);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    try {
      await mutation.mutateAsync({ username, password });
    } catch (err: any) {
      let message = "Something went wrong. Please try again.";
      if (err?.message) {
        const colonIdx = err.message.indexOf(": ");
        if (colonIdx !== -1) {
          const jsonPart = err.message.slice(colonIdx + 2);
          try {
            const parsed = JSON.parse(jsonPart);
            if (parsed?.message) message = parsed.message;
          } catch {
            message = jsonPart || message;
          }
        }
      }
      setError(message);
    }
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError(null);
    setFieldErrors({});
    setUsername("");
    setPassword("");
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nexus AI</h1>
          <p className="text-muted-foreground text-sm">Autonomous Customer Resolution Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isRegister ? "Create account" : "Sign in"}</CardTitle>
            <CardDescription>
              {isRegister
                ? "Create a new account to access the portal."
                : "Enter your credentials to sign in."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  type="text"
                  placeholder={isRegister ? "e.g. john123" : "Enter your username"}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, username: "" }));
                  }}
                  required
                  autoComplete="username"
                  className={fieldErrors.username ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {isRegister && username.length > 0 && (
                  <div className="text-[11px] space-y-1 mt-1">
                    {usernameRules.map((r) => <RuleItem key={r.text} {...r} />)}
                  </div>
                )}
                {fieldErrors.username && (
                  <p className="text-xs text-destructive">{fieldErrors.username}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isRegister ? "e.g. john@123" : "Enter your password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    required
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    className={`pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    data-testid="button-toggle-password"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isRegister && password.length > 0 && (
                  <div className="text-[11px] space-y-1 mt-1">
                    {passwordRules.map((r) => <RuleItem key={r.text} {...r} />)}
                  </div>
                )}
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </div>

              {isRegister && (
                <div className="rounded-lg px-3 py-2.5 text-[11px] text-muted-foreground space-y-0.5"
                  style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
                  <p className="font-medium text-foreground mb-1">Format guide:</p>
                  <p>• Username: <span className="font-mono">john123</span> (letters + numbers only)</p>
                  <p>• Password: <span className="font-mono">john@123</span> or <span className="font-mono">pass2024</span> (mix of letters & numbers)</p>
                </div>
              )}

              {error && (
                <p data-testid="text-auth-error" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                data-testid="button-submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRegister ? "Create account" : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {!isRegister ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    data-testid="link-toggle-mode"
                    onClick={() => switchMode("register")}
                    className="text-primary underline-offset-4 hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    data-testid="link-toggle-mode"
                    onClick={() => switchMode("login")}
                    className="text-primary underline-offset-4 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
