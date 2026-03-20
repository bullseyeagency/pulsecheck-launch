"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/campaign-builder";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#141414] rounded-xl border-2 border-[#2a2a2a]">
        {/* Logo/Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            PulseCheck Launch
          </h1>
          <p className="text-[#a1a1aa]">
            Sign in to access your campaigns
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              {error === "OAuthSignin" && "Error starting OAuth sign in"}
              {error === "OAuthCallback" && "Error during OAuth callback"}
              {error === "OAuthCreateAccount" && "Could not create OAuth account"}
              {error === "EmailCreateAccount" && "Could not create email account"}
              {error === "Callback" && "Error in OAuth callback"}
              {error === "OAuthAccountNotLinked" && "Account already exists with different provider"}
              {error === "SessionRequired" && "Please sign in to access this page"}
              {error === "Default" && "An error occurred during sign in"}
            </p>
          </div>
        )}

        {/* Sign In Button */}
        <div className="space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#2a2a2a] rounded-lg bg-[#141414] hover:bg-[#1a1a1a] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-[#d4d4d8] font-medium">
              Continue with Google
            </span>
          </button>

          <p className="text-center text-sm text-[#8b8b93]">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Additional Info */}
        <div className="border-t border-[#2a2a2a] pt-6">
          <p className="text-center text-sm text-[#a1a1aa]">
            New to PulseCheck?{" "}
            <span className="text-[#EF5744] font-medium">
              Sign in to create your account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
