"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1); // 1: Create org, 2: Connect Google Ads
  const [organizationName, setOrganizationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user already has an organization
  useEffect(() => {
    const checkOrganization = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/user/check-org");
          const data = await response.json();
          if (data.hasOrganization) {
            setStep(2);
            setOrganizationName(data.organizationName || "");
          }
        } catch (err) {
          console.error("Failed to check organization:", err);
        }
      }
    };

    checkOrganization();
  }, [session]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization");
      }

      // Update session with new organizationId
      await update();

      // Move to step 2: Connect Google Ads
      setStep(2);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleConnectGoogleAds = () => {
    // Redirect to Google Ads OAuth
    window.location.href = "/api/google-ads/connect";
  };

  const handleSkip = () => {
    // Skip Google Ads connection for now
    const callbackUrl = searchParams.get("callbackUrl") || "/campaign-builder";
    router.push(callbackUrl);
  };

  // Generate slug from organization name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const slug = generateSlug(organizationName);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#141414] rounded-xl border-2 border-[#2a2a2a]">
        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-[#c93a2a]' : 'bg-[#2a2a2a]'}`} />
          <div className={`h-0.5 w-8 ${step >= 2 ? 'bg-[#c93a2a]' : 'bg-[#2a2a2a]'}`} />
          <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-[#c93a2a]' : 'bg-[#2a2a2a]'}`} />
        </div>

        {/* Step 1: Create Organization */}
        {step === 1 && (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to PulseCheck Launch!
              </h1>
              <p className="text-[#a1a1aa]">
                Let's set up your organization to get started
              </p>
              {session?.user?.email && (
                <p className="text-sm text-[#8b8b93] mt-2">
                  Signed in as {session.user.email}
                </p>
              )}
            </div>

            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div>
                <label
                  htmlFor="organizationName"
                  className="block text-sm font-medium text-[#d4d4d8] mb-2"
                >
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Acme Inc"
                  className="w-full px-4 py-2 bg-[#141414] border border-[#2a2a2a] text-white rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-[#EF5744] placeholder-[#8b8b93]"
                />
                {slug && (
                  <p className="mt-2 text-sm text-[#8b8b93]">
                    URL: pulsecheck.dalyandco.com/<span className="font-medium">{slug}</span>
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !organizationName.trim()}
                className="w-full bg-[#c93a2a] hover:bg-[#a83020] disabled:bg-[#2a2a2a] disabled:text-[#8b8b93] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? "Creating..." : "Continue"}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Connect Google Ads */}
        {step === 2 && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">
                Connect Your Google Ads Account
              </h1>
              <p className="text-[#a1a1aa]">
                Link your Google Ads account to start managing campaigns
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[rgba(239,87,68,0.04)] border border-[#EF5744] rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">What you'll need:</h3>
                <ul className="text-sm text-[#d4d4d8] space-y-1">
                  <li>- Google account with Ads access</li>
                  <li>- Permission to manage campaigns</li>
                  <li>- Google Ads Customer ID (format: 123-456-7890)</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleConnectGoogleAds}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect with Google
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-[#a1a1aa] hover:text-white font-medium py-2 transition-colors"
              >
                Skip for now
              </button>
            </div>

            <div className="border-t border-[#2a2a2a] pt-6">
              <p className="text-center text-xs text-[#8b8b93]">
                You can connect your Google Ads account later from settings
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
