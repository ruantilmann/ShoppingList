"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: window.location.origin,
      },
      {
        onSuccess: (context) => {
          const url = context.data?.url;
          if (url) {
            window.location.href = url;
          }
        },
        onError: (context) => {
          setError(context.error?.message || context.error?.statusText || "Failed to sign in");
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-6 px-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Use sua conta Google ou email e senha para acessar suas listas.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full">
        {isLoading ? "Redirecionando..." : "Entrar com Google"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {mode === "sign-in" ? (
        <SignInForm onSwitchToSignUp={() => setMode("sign-up")} />
      ) : (
        <SignUpForm onSwitchToSignIn={() => setMode("sign-in")} />
      )}
    </div>
  );
}
