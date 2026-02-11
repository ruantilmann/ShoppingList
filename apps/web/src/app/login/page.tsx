"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <p className="text-sm text-muted-foreground">Use sua conta Google para acessar suas listas.</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="rounded border px-4 py-2"
        disabled={isLoading}
      >
        {isLoading ? "Redirecionando..." : "Entrar com Google"}
      </button>
    </div>
  );
}
