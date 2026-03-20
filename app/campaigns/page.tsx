'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ClientAccount {
  id: string;
  name: string;
  currency: string;
  timeZone: string;
}

export default function CampaignsPage() {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientAccounts();
  }, []);

  async function fetchClientAccounts() {
    try {
      const response = await fetch('/api/campaigns/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');

      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EF5744] mx-auto"></div>
          <p className="mt-4 text-[#a1a1aa]">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Accounts</h2>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Campaign Manager</h1>
              <p className="mt-1 text-sm text-[#8b8b93]">Select a client account to manage campaigns</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/campaigns/keywords"
                className="px-4 py-2 bg-[#c93a2a] text-white rounded-lg font-medium hover:bg-[#a83020] transition-colors text-sm"
              >
                📊 Keywords Performance
              </Link>
              <Link
                href="/"
                className="text-sm text-[#EF5744] hover:text-[#EF5744] font-medium"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Client Accounts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {accounts.length === 0 ? (
          <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-12 text-center">
            <div className="text-[#8b8b93] mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Client Accounts Found</h3>
            <p className="text-[#8b8b93]">No accounts are available under your manager account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Link
                key={account.id}
                href={`/campaigns/${account.id}`}
                className="bg-[#141414] rounded-lg border border-[#2a2a2a] hover:border-[#EF5744] transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {account.name}
                    </h3>
                    <p className="text-sm text-[#8b8b93]">ID: {account.id}</p>
                  </div>
                  <svg
                    className="h-5 w-5 text-[#8b8b93]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-[#a1a1aa]">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{account.currency}</span>
                  </div>
                  <div className="flex items-center text-[#a1a1aa]">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{account.timeZone}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1f1f1f]">
                  <span className="text-sm font-medium text-[#EF5744]">
                    Manage Campaigns →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
