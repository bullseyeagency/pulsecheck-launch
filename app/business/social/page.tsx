'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Share2, Loader2, ExternalLink } from 'lucide-react';

interface PinterestResult {
  page_url?: string;
  pins_count?: number;
  followers_count?: number;
  title?: string;
}

interface RedditResult {
  page_url?: string;
  subreddit?: string;
  score?: number;
  title?: string;
  comments_count?: number;
  post_url?: string;
}

export default function SocialMediaPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinterest, setPinterest] = useState<PinterestResult[]>([]);
  const [reddit, setReddit] = useState<RedditResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError('');
    setPinterest([]);
    setReddit([]);

    try {
      const res = await fetch('/api/business/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const pItems = data.pinterest?.[0]?.items || data.pinterest || [];
      const rItems = data.reddit?.[0]?.items || data.reddit || [];
      setPinterest(pItems);
      setReddit(rItems);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Share2 className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Social Media</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Target URL</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="example.com"
                className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                required
              />
              <p className="text-xs text-[#8b8b93] mt-1">
                Searches Pinterest and Reddit for mentions of this URL
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                'Search Social Media'
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 rounded p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {(pinterest.length > 0 || reddit.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pinterest */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#EF5744]" />
                  Pinterest
                  <span className="text-xs font-mono text-[#8b8b93]">({pinterest.length})</span>
                </h2>

                {pinterest.length > 0 ? (
                  <div className="space-y-3">
                    {pinterest.map((item, index) => (
                      <div key={index} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                        {item.title && (
                          <h3 className="text-sm font-medium text-white mb-2">{item.title}</h3>
                        )}

                        <div className="flex items-center gap-4 text-xs text-[#a1a1aa] mb-2">
                          {item.pins_count != null && (
                            <span>
                              Pins: <span className="text-white font-mono">{item.pins_count.toLocaleString()}</span>
                            </span>
                          )}
                          {item.followers_count != null && (
                            <span>
                              Followers: <span className="text-white font-mono">{item.followers_count.toLocaleString()}</span>
                            </span>
                          )}
                        </div>

                        {item.page_url && (
                          <a
                            href={item.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#EF5744] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on Pinterest
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#8b8b93]">No Pinterest results found.</p>
                )}
              </div>

              {/* Reddit */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#EF5744]" />
                  Reddit
                  <span className="text-xs font-mono text-[#8b8b93]">({reddit.length})</span>
                </h2>

                {reddit.length > 0 ? (
                  <div className="space-y-3">
                    {reddit.map((item, index) => (
                      <div key={index} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                        {item.title && (
                          <h3 className="text-sm font-medium text-white mb-2">{item.title}</h3>
                        )}

                        <div className="flex items-center gap-4 text-xs text-[#a1a1aa] mb-2">
                          {item.subreddit && (
                            <span className="text-[#EF5744]">r/{item.subreddit}</span>
                          )}
                          {item.score != null && (
                            <span>
                              Score: <span className="text-white font-mono">{item.score.toLocaleString()}</span>
                            </span>
                          )}
                          {item.comments_count != null && (
                            <span>
                              Comments: <span className="text-white font-mono">{item.comments_count.toLocaleString()}</span>
                            </span>
                          )}
                        </div>

                        {(item.post_url || item.page_url) && (
                          <a
                            href={item.post_url || item.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#EF5744] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on Reddit
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#8b8b93]">No Reddit results found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
