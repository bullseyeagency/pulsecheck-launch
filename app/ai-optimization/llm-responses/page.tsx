'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Bot, Loader2 } from 'lucide-react';

interface LLMResponseResult {
  response_text?: string;
  model_name?: string;
  input_tokens?: number;
  output_tokens?: number;
  money_spent?: number;
  annotations?: { url?: string; title?: string; text?: string }[];
  sources?: { url?: string; title?: string; text?: string }[];
}

const MODEL_OPTIONS = [
  { group: 'ChatGPT', models: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o'] },
  { group: 'Claude', models: ['claude-sonnet-4-20250514'] },
  { group: 'Gemini', models: ['gemini-2.0-flash'] },
];

export default function LLMResponsesPage() {
  const [prompt, setPrompt] = useState('');
  const [modelName, setModelName] = useState('gpt-4.1-mini');
  const [webSearch, setWebSearch] = useState(true);
  const [temperature, setTemperature] = useState(0.94);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LLMResponseResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/ai-optimization/llm-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: prompt.trim(),
          model_name: modelName,
          web_search: webSearch,
          temperature,
          max_output_tokens: 2048,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results?.[0]?.items || data.results || [];
      if (items.length > 0) {
        setResult(items[0]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformLabel = (model: string) => {
    if (model.startsWith('gpt-')) return 'ChatGPT';
    if (model.startsWith('claude-')) return 'Claude';
    if (model.startsWith('gemini-')) return 'Gemini';
    return 'Unknown';
  };

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Bot className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">LLM Responses</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="space-y-4">
              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Prompt <span className="text-[#8b8b93]">(max 500 characters)</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                  placeholder="What are the best SEO tools for small businesses?"
                  rows={4}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm resize-y"
                  required
                />
                <p className="text-xs text-[#8b8b93] mt-1 text-right font-mono">
                  {prompt.length}/500
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Model select */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    Model
                  </label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                  >
                    {MODEL_OPTIONS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.models.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-[#8b8b93] mt-1">
                    Platform: <span className="text-[#EF5744] font-mono">{getPlatformLabel(modelName)}</span>
                  </p>
                </div>

                {/* Web search toggle */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    Web Search
                  </label>
                  <button
                    type="button"
                    onClick={() => setWebSearch(!webSearch)}
                    className={`w-full px-3 py-2 rounded text-sm font-medium border-2 transition-all ${
                      webSearch
                        ? 'border-[#EF5744] bg-[rgba(239,87,68,0.12)] text-[#EF5744]'
                        : 'border-[#2a2a2a] text-[#8b8b93] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    {webSearch ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    Temperature: <span className="text-white font-mono">{temperature.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full accent-[#EF5744]"
                  />
                  <div className="flex justify-between text-xs text-[#8b8b93] mt-1">
                    <span>0 (precise)</span>
                    <span>2 (creative)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate Response'
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 rounded p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Metadata cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Model', value: result.model_name || modelName },
                  { label: 'Input Tokens', value: result.input_tokens?.toLocaleString() ?? '-' },
                  { label: 'Output Tokens', value: result.output_tokens?.toLocaleString() ?? '-' },
                  { label: 'Cost', value: result.money_spent != null ? `$${result.money_spent.toFixed(4)}` : '-' },
                  { label: 'Platform', value: getPlatformLabel(result.model_name || modelName) },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3">
                    <p className="text-xs text-[#8b8b93] uppercase tracking-wider">{stat.label}</p>
                    <p className="text-sm text-white font-mono mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Response text */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
                <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Response</h3>
                <div className="text-sm text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">
                  {result.response_text || 'No response text returned.'}
                </div>
              </div>

              {/* Annotations/Sources */}
              {((result.annotations && result.annotations.length > 0) ||
                (result.sources && result.sources.length > 0)) && (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
                  <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Sources & Annotations</h3>
                  <ul className="space-y-2">
                    {(result.annotations || result.sources || []).map((src, i) => (
                      <li key={i} className="text-sm">
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#EF5744] hover:underline"
                        >
                          {src.title || src.url}
                        </a>
                        {src.text && (
                          <p className="text-xs text-[#8b8b93] mt-0.5">{src.text}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
