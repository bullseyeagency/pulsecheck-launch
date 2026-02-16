'use client';

import { useState, useMemo } from 'react';
import { Upload, FileJson, Eye, Download, Search, Replace, Undo, ChevronDown, ChevronUp, Table, Grid, Filter, X, Plus, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface AdCopyData {
  campaign: string;
  ad_group?: string;
  responsive_search_ad: {
    headlines: string[];
    descriptions: string[];
    path_1?: string;
    path_2?: string;
    final_url?: string;
  };
  fileName?: string;
}

interface TableRow {
  id: string;
  campaign: string;
  ad_group: string;
  fileName: string;
  final_url: string;
  path_1: string;
  path_2: string;
  headline_1: string;
  headline_2: string;
  headline_3: string;
  headline_4: string;
  headline_5: string;
  headline_6: string;
  headline_7: string;
  headline_8: string;
  headline_9: string;
  headline_10: string;
  headline_11: string;
  headline_12: string;
  headline_13: string;
  headline_14: string;
  headline_15: string;
  description_1: string;
  description_2: string;
  description_3: string;
  description_4: string;
}

export default function BulkAdsGeneratorPage() {
  const [uploadedFiles, setUploadedFiles] = useState<AdCopyData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [history, setHistory] = useState<AdCopyData[][]>([]);
  const [highlightMatches, setHighlightMatches] = useState(true);
  const [viewMode, setViewMode] = useState<'json' | 'table'>('json');
  const [filters, setFilters] = useState({
    campaign: '',
    headlines: '',
    descriptions: '',
  });

  const handleFileUpload = async (files: FileList) => {
    const newAds: AdCopyData[] = [];

    for (const file of Array.from(files)) {
      const fileType = file.name.split('.').pop()?.toLowerCase();

      if (fileType === 'json') {
        try {
          const text = await file.text();
          const data = JSON.parse(text);

          // Check if this is a progress file from ad-copy-builder
          if (data.version && data.ad_groups && Array.isArray(data.ad_groups)) {
            // Progress file format - convert to export format
            data.ad_groups
              .filter((ag: any) => ag.status === 'complete') // Only import completed ones
              .forEach((ag: any) => {
                newAds.push({
                  campaign: ag.campaign_name,
                  ad_group: ag.ad_group,
                  responsive_search_ad: {
                    final_url: ag.final_url,
                    path_1: ag.path_1,
                    path_2: ag.path_2,
                    headlines: ag.headlines.filter((h: string) => h.trim()),
                    descriptions: ag.descriptions.filter((d: string) => d.trim()),
                  },
                  fileName: file.name,
                });
              });
          } else if (Array.isArray(data)) {
            // Export file format - array of ads
            data.forEach((ad: AdCopyData) => {
              newAds.push({
                ...ad,
                fileName: file.name,
              });
            });
          } else {
            // Single ad object
            newAds.push({
              ...data,
              fileName: file.name,
            });
          }
        } catch (error) {
          console.error(`Error parsing ${file.name}:`, error);
          alert(`Failed to parse ${file.name}. Please check the file format.`);
        }
      }
    }

    setUploadedFiles([...uploadedFiles, ...newAds]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const getCombinedData = () => {
    return uploadedFiles;
  };

  const exportCombinedJSON = () => {
    const combined = getCombinedData();
    const blob = new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'combined-ads.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Search/Replace Functions
  const createSearchPattern = (term: string) => {
    if (!term) return null;
    try {
      if (useRegex) {
        return new RegExp(term, caseSensitive ? 'g' : 'gi');
      } else {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
        return new RegExp(pattern, caseSensitive ? 'g' : 'gi');
      }
    } catch (e) {
      return null;
    }
  };

  const findMatches = useMemo(() => {
    if (!searchTerm) return { count: 0, matches: [] };
    const pattern = createSearchPattern(searchTerm);
    if (!pattern) return { count: 0, matches: [] };

    let count = 0;
    const matches: Array<{ adIndex: number }> = [];

    uploadedFiles.forEach((ad, index) => {
      const allText = [
        ad.campaign,
        ...ad.responsive_search_ad.headlines,
        ...ad.responsive_search_ad.descriptions,
      ].join(' ');

      const matchCount = (allText.match(pattern) || []).length;
      if (matchCount > 0) {
        count += matchCount;
        matches.push({ adIndex: index });
      }
    });

    return { count, matches };
  }, [searchTerm, uploadedFiles, caseSensitive, wholeWord, useRegex]);

  const handleReplaceAll = () => {
    if (!searchTerm) return;
    const pattern = createSearchPattern(searchTerm);
    if (!pattern) {
      alert('Invalid search pattern');
      return;
    }

    setHistory([...history, JSON.parse(JSON.stringify(uploadedFiles))]);

    const updated = uploadedFiles.map(ad => ({
      ...ad,
      campaign: ad.campaign.replace(pattern, replaceTerm),
      responsive_search_ad: {
        headlines: ad.responsive_search_ad.headlines.map(h => h.replace(pattern, replaceTerm)),
        descriptions: ad.responsive_search_ad.descriptions.map(d => d.replace(pattern, replaceTerm)),
      },
    }));

    setUploadedFiles(updated);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setUploadedFiles(previous);
    setHistory(history.slice(0, -1));
  };

  const isAdMatch = (ad: AdCopyData): boolean => {
    if (!searchTerm || !highlightMatches) return false;
    const pattern = createSearchPattern(searchTerm);
    if (!pattern) return false;
    const allText = [
      ad.campaign,
      ...ad.responsive_search_ad.headlines,
      ...ad.responsive_search_ad.descriptions,
    ].join(' ');
    return pattern.test(allText);
  };

  // Edit functions for JSON view
  const updateCampaignName = (index: number, value: string) => {
    const updated = [...uploadedFiles];
    updated[index] = { ...updated[index], campaign: value };
    setUploadedFiles(updated);
  };

  const updateHeadline = (adIndex: number, headlineIndex: number, value: string) => {
    const updated = [...uploadedFiles];
    const headlines = [...updated[adIndex].responsive_search_ad.headlines];
    headlines[headlineIndex] = value;
    updated[adIndex] = {
      ...updated[adIndex],
      responsive_search_ad: {
        ...updated[adIndex].responsive_search_ad,
        headlines,
      },
    };
    setUploadedFiles(updated);
  };

  const updateDescription = (adIndex: number, descIndex: number, value: string) => {
    const updated = [...uploadedFiles];
    const descriptions = [...updated[adIndex].responsive_search_ad.descriptions];
    descriptions[descIndex] = value;
    updated[adIndex] = {
      ...updated[adIndex],
      responsive_search_ad: {
        ...updated[adIndex].responsive_search_ad,
        descriptions,
      },
    };
    setUploadedFiles(updated);
  };

  const addHeadline = (adIndex: number) => {
    if (uploadedFiles[adIndex].responsive_search_ad.headlines.length >= 15) {
      alert('Maximum 15 headlines allowed');
      return;
    }
    const updated = [...uploadedFiles];
    updated[adIndex] = {
      ...updated[adIndex],
      responsive_search_ad: {
        ...updated[adIndex].responsive_search_ad,
        headlines: [...updated[adIndex].responsive_search_ad.headlines, ''],
      },
    };
    setUploadedFiles(updated);
  };

  const removeHeadline = (adIndex: number, headlineIndex: number) => {
    const updated = [...uploadedFiles];
    const headlines = updated[adIndex].responsive_search_ad.headlines.filter((_, i) => i !== headlineIndex);
    updated[adIndex] = {
      ...updated[adIndex],
      responsive_search_ad: {
        ...updated[adIndex].responsive_search_ad,
        headlines,
      },
    };
    setUploadedFiles(updated);
  };

  const addDescription = (adIndex: number) => {
    if (uploadedFiles[adIndex].responsive_search_ad.descriptions.length >= 4) {
      alert('Maximum 4 descriptions allowed');
      return;
    }
    const updated = [...uploadedFiles];
    updated[adIndex] = {
      ...updated[adIndex],
      responsive_search_ad: {
        ...updated[adIndex].responsive_search_ad,
        descriptions: [...updated[adIndex].responsive_search_ad.descriptions, ''],
      },
    };
    setUploadedFiles(updated);
  };

  const removeDescription = (adIndex: number, descIndex: number) => {
    const updated = [...uploadedFiles];
    const descriptions = updated[adIndex].responsive_search_ad.descriptions.filter((_, i) => i !== descIndex);
    updated[adIndex] = {
      ...updated[adIndex],
      responsive_search_ad: {
        ...updated[adIndex].responsive_search_ad,
        descriptions,
      },
    };
    setUploadedFiles(updated);
  };

  // Table conversion functions
  const jsonToTableRows = useMemo((): TableRow[] => {
    const rows: TableRow[] = [];
    uploadedFiles.forEach((ad) => {
      // Safety check for responsive_search_ad
      if (!ad.responsive_search_ad) {
        console.warn('Ad missing responsive_search_ad:', ad);
        return;
      }

      rows.push({
        id: ad.ad_group ? `${ad.campaign}-${ad.ad_group}` : ad.campaign,
        campaign: ad.campaign,
        ad_group: ad.ad_group || '',
        fileName: ad.fileName || '',
        final_url: ad.responsive_search_ad.final_url || '',
        path_1: ad.responsive_search_ad.path_1 || '',
        path_2: ad.responsive_search_ad.path_2 || '',
        headline_1: ad.responsive_search_ad.headlines[0] || '',
        headline_2: ad.responsive_search_ad.headlines[1] || '',
        headline_3: ad.responsive_search_ad.headlines[2] || '',
        headline_4: ad.responsive_search_ad.headlines[3] || '',
        headline_5: ad.responsive_search_ad.headlines[4] || '',
        headline_6: ad.responsive_search_ad.headlines[5] || '',
        headline_7: ad.responsive_search_ad.headlines[6] || '',
        headline_8: ad.responsive_search_ad.headlines[7] || '',
        headline_9: ad.responsive_search_ad.headlines[8] || '',
        headline_10: ad.responsive_search_ad.headlines[9] || '',
        headline_11: ad.responsive_search_ad.headlines[10] || '',
        headline_12: ad.responsive_search_ad.headlines[11] || '',
        headline_13: ad.responsive_search_ad.headlines[12] || '',
        headline_14: ad.responsive_search_ad.headlines[13] || '',
        headline_15: ad.responsive_search_ad.headlines[14] || '',
        description_1: ad.responsive_search_ad.descriptions[0] || '',
        description_2: ad.responsive_search_ad.descriptions[1] || '',
        description_3: ad.responsive_search_ad.descriptions[2] || '',
        description_4: ad.responsive_search_ad.descriptions[3] || '',
      });
    });
    return rows;
  }, [uploadedFiles]);

  const [tableData, setTableData] = useState<TableRow[]>([]);

  useMemo(() => {
    setTableData(jsonToTableRows);
  }, [jsonToTableRows]);

  const updateTableCell = (rowId: string, field: keyof TableRow, value: string) => {
    setTableData(
      tableData.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const tableToJSON = (): AdCopyData[] => {
    return tableData.map((row) => ({
      campaign: row.campaign,
      ad_group: row.ad_group || undefined,
      fileName: row.fileName,
      responsive_search_ad: {
        final_url: row.final_url,
        path_1: row.path_1,
        path_2: row.path_2,
        headlines: [
          row.headline_1,
          row.headline_2,
          row.headline_3,
          row.headline_4,
          row.headline_5,
          row.headline_6,
          row.headline_7,
          row.headline_8,
          row.headline_9,
          row.headline_10,
          row.headline_11,
          row.headline_12,
          row.headline_13,
          row.headline_14,
          row.headline_15,
        ].filter(h => h !== ''),
        descriptions: [
          row.description_1,
          row.description_2,
          row.description_3,
          row.description_4,
        ].filter(d => d !== ''),
      },
    }));
  };

  const syncTableToJSON = () => {
    setHistory([...history, JSON.parse(JSON.stringify(uploadedFiles))]);
    setUploadedFiles(tableToJSON());
  };

  // Filter table data
  const filteredTableData = useMemo(() => {
    return tableData.filter((row) => {
      const matchesCampaign = row.campaign.toLowerCase().includes(filters.campaign.toLowerCase());

      const allHeadlines = [
        row.headline_1, row.headline_2, row.headline_3,
        row.headline_4, row.headline_5, row.headline_6,
        row.headline_7, row.headline_8, row.headline_9,
      ].join(' ').toLowerCase();
      const matchesHeadlines = filters.headlines === '' || allHeadlines.includes(filters.headlines.toLowerCase());

      const allDescriptions = [
        row.description_1, row.description_2, row.description_3,
        row.description_4,
      ].join(' ').toLowerCase();
      const matchesDescriptions = filters.descriptions === '' || allDescriptions.includes(filters.descriptions.toLowerCase());

      return matchesCampaign && matchesHeadlines && matchesDescriptions;
    });
  }, [tableData, filters]);

  const clearFilters = () => {
    setFilters({
      campaign: '',
      headlines: '',
      descriptions: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => f !== '');

  const exportToCSV = () => {
    const dataToExport = hasActiveFilters ? filteredTableData : tableData;
    const headers = [
      'campaign', 'ad_group', 'final_url', 'path_1', 'path_2',
      'headline_1', 'headline_2', 'headline_3', 'headline_4', 'headline_5',
      'headline_6', 'headline_7', 'headline_8', 'headline_9', 'headline_10',
      'headline_11', 'headline_12', 'headline_13', 'headline_14', 'headline_15',
      'description_1', 'description_2', 'description_3', 'description_4'
    ];
    const csvRows = [
      headers.join(','),
      ...dataToExport.map((row) =>
        [
          `"${row.campaign}"`, `"${row.ad_group}"`, `"${row.final_url}"`, `"${row.path_1}"`, `"${row.path_2}"`,
          `"${row.headline_1}"`, `"${row.headline_2}"`, `"${row.headline_3}"`,
          `"${row.headline_4}"`, `"${row.headline_5}"`, `"${row.headline_6}"`,
          `"${row.headline_7}"`, `"${row.headline_8}"`, `"${row.headline_9}"`,
          `"${row.headline_10}"`, `"${row.headline_11}"`, `"${row.headline_12}"`,
          `"${row.headline_13}"`, `"${row.headline_14}"`, `"${row.headline_15}"`,
          `"${row.description_1}"`, `"${row.description_2}"`, `"${row.description_3}"`,
          `"${row.description_4}"`,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ads-export${hasActiveFilters ? '-filtered' : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prepare Ads</h1>
          <p className="mt-2 text-gray-600">
            Bulk edit and generate ad copy, then export to CSV for Google Ads Editor
          </p>
        </div>

        {/* Instructions */}
        {uploadedFiles.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How to use:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Upload the <strong>ad copy JSON exported from Step 3 (Ad Copy Builder)</strong></li>
              <li>View your ads in JSON or Table view</li>
              <li>Use Search & Replace to bulk edit headlines and descriptions across all ads</li>
              <li>Edit individual ad copy, URLs, or paths in either view</li>
              <li>Add or remove headlines and descriptions as needed</li>
              <li>Export to CSV to create the Google Ads Editor import template</li>
              <li>Import the CSV file into Google Ads Editor to bulk create ads</li>
            </ol>
            <p className="text-xs text-blue-700 mt-3">
              <strong>Tip:</strong> The ad copy JSON from Step 3 contains all your completed ad groups with headlines, descriptions, and URLs.
              This tool lets you make final edits and converts everything to CSV format ready for Google Ads Editor bulk import.
            </p>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500 font-medium">
                Import Ad Copy JSON
              </span>
              <span className="text-gray-600"> or drag and drop</span>
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">Upload the ad copy JSON from Step 3 (Ad Copy Builder)</p>
          <p className="text-xs text-gray-500 mt-1">Accepts exported ad copy or progress files</p>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileJson className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Ad Copy JSON</span>
            </div>
          </div>
        </div>

        {/* Search/Replace Panel */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => setShowSearchReplace(!showSearchReplace)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Search & Replace</span>
                {findMatches.count > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {findMatches.count} {findMatches.count === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </div>
              {showSearchReplace ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {showSearchReplace && (
              <div className="px-6 py-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Find
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter search term or regex"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Replace with
                    </label>
                    <input
                      type="text"
                      value={replaceTerm}
                      onChange={(e) => setReplaceTerm(e.target.value)}
                      placeholder="Enter replacement text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={caseSensitive}
                      onChange={(e) => setCaseSensitive(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Case sensitive</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wholeWord}
                      onChange={(e) => setWholeWord(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Match whole word</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useRegex}
                      onChange={(e) => setUseRegex(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Use regex</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highlightMatches}
                      onChange={(e) => setHighlightMatches(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Highlight matches</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleReplaceAll}
                    disabled={!searchTerm || findMatches.count === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Replace className="h-4 w-4" />
                    Replace All ({findMatches.count})
                  </button>
                  <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Undo className="h-4 w-4" />
                    Undo
                  </button>
                  {history.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {history.length} {history.length === 1 ? 'change' : 'changes'} in history
                    </span>
                  )}
                </div>

                {useRegex && (
                  <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
                    <strong>Regex mode:</strong> Use patterns like <code className="bg-white px-1 rounded">ride(s)?</code> or <code className="bg-white px-1 rounded">\d+</code>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats Bar */}
        {uploadedFiles.length > 0 && (
          <>
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-gray-600">Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(uploadedFiles.map(ad => ad.campaign)).size}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ad Groups</p>
                    <p className="text-2xl font-bold text-gray-900">{uploadedFiles.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Headlines</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {uploadedFiles.reduce((sum, ad) => sum + (ad.responsive_search_ad?.headlines?.length || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Descriptions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {uploadedFiles.reduce((sum, ad) => sum + (ad.responsive_search_ad?.descriptions?.length || 0), 0)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportCombinedJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export Combined JSON
                  </button>
                  {history.length > 0 && (
                    <span className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
                      Edited ({history.length} {history.length === 1 ? 'change' : 'changes'})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Visualizer */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-6">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setViewMode('json')}
                  className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
                    viewMode === 'json'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                  JSON View
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
                    viewMode === 'table'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Table className="h-4 w-4" />
                  Table View
                </button>
              </div>
              <div className="flex items-center gap-3">
                {viewMode === 'table' && (
                  <>
                    <button
                      onClick={syncTableToJSON}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Save Changes to JSON
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV {hasActiveFilters && `(${filteredTableData.length})`}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* JSON View */}
            {viewMode === 'json' && (
              <div className="grid gap-6">
                {uploadedFiles.map((ad, index) => {
                  const hasMatch = isAdMatch(ad);
                  return (
                    <div
                      key={index}
                      className={`bg-white rounded-lg shadow overflow-hidden transition-colors ${
                        hasMatch ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    >
                      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 mr-4">
                            <label className="block text-purple-200 text-xs mb-1">Campaign Name</label>
                            <input
                              type="text"
                              value={ad.campaign}
                              onChange={(e) => updateCampaignName(index, e.target.value)}
                              className="w-full px-3 py-2 text-white bg-purple-800 bg-opacity-50 border border-purple-400 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                            />
                            {ad.ad_group && (
                              <p className="text-purple-200 text-sm font-medium mt-2">
                                Ad Group: {ad.ad_group}
                              </p>
                            )}
                            {ad.fileName && (
                              <p className="text-purple-200 text-xs mt-1">
                                Source: {ad.fileName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-white text-sm">
                            <div className="text-right">
                              <p className="text-purple-100">Headlines</p>
                              <p className="text-xl font-bold">{ad.responsive_search_ad.headlines.length}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-purple-100">Descriptions</p>
                              <p className="text-xl font-bold">{ad.responsive_search_ad.descriptions.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* URL and Paths */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Final URL
                            </label>
                            <input
                              type="text"
                              value={ad.responsive_search_ad.final_url || ''}
                              onChange={(e) => {
                                const updated = [...uploadedFiles];
                                updated[index] = {
                                  ...updated[index],
                                  responsive_search_ad: {
                                    ...updated[index].responsive_search_ad,
                                    final_url: e.target.value,
                                  },
                                };
                                setUploadedFiles(updated);
                              }}
                              placeholder="https://example.com/page"
                              maxLength={2048}
                              className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <span className="text-xs text-gray-500 mt-1">
                              {(ad.responsive_search_ad.final_url || '').length}/2048 characters
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Path 1
                              </label>
                              <input
                                type="text"
                                value={ad.responsive_search_ad.path_1 || ''}
                                onChange={(e) => {
                                  const updated = [...uploadedFiles];
                                  updated[index] = {
                                    ...updated[index],
                                    responsive_search_ad: {
                                      ...updated[index].responsive_search_ad,
                                      path_1: e.target.value,
                                    },
                                  };
                                  setUploadedFiles(updated);
                                }}
                                placeholder="path1"
                                maxLength={15}
                                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="text-xs text-gray-500 mt-1">
                                {(ad.responsive_search_ad.path_1 || '').length}/15 characters
                              </span>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Path 2
                              </label>
                              <input
                                type="text"
                                value={ad.responsive_search_ad.path_2 || ''}
                                onChange={(e) => {
                                  const updated = [...uploadedFiles];
                                  updated[index] = {
                                    ...updated[index],
                                    responsive_search_ad: {
                                      ...updated[index].responsive_search_ad,
                                      path_2: e.target.value,
                                    },
                                  };
                                  setUploadedFiles(updated);
                                }}
                                placeholder="path2"
                                maxLength={15}
                                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="text-xs text-gray-500 mt-1">
                                {(ad.responsive_search_ad.path_2 || '').length}/15 characters
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Headlines */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Headlines</h4>
                            <button
                              onClick={() => addHeadline(index)}
                              disabled={ad.responsive_search_ad.headlines.length >= 15}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-3 w-3" />
                              Add Headline
                            </button>
                          </div>
                          <div className="space-y-2">
                            {ad.responsive_search_ad.headlines.map((headline, hIndex) => (
                              <div key={hIndex} className="flex items-start gap-2">
                                <span className="text-blue-600 font-medium text-sm mt-2 flex-shrink-0">
                                  H{hIndex + 1}:
                                </span>
                                <input
                                  type="text"
                                  value={headline}
                                  onChange={(e) => updateHeadline(index, hIndex, e.target.value)}
                                  placeholder={`Headline ${hIndex + 1}`}
                                  maxLength={30}
                                  className="flex-1 px-3 py-2 text-sm text-gray-900 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-xs text-gray-500 mt-2 w-12 text-right">{headline.length}/30</span>
                                <button
                                  onClick={() => removeHeadline(index, hIndex)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Descriptions</h4>
                            <button
                              onClick={() => addDescription(index)}
                              disabled={ad.responsive_search_ad.descriptions.length >= 5}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-3 w-3" />
                              Add Description
                            </button>
                          </div>
                          <div className="space-y-2">
                            {ad.responsive_search_ad.descriptions.map((description, dIndex) => (
                              <div key={dIndex} className="flex items-start gap-2">
                                <span className="text-green-600 font-medium text-sm mt-2 flex-shrink-0">
                                  D{dIndex + 1}:
                                </span>
                                <textarea
                                  value={description}
                                  onChange={(e) => updateDescription(index, dIndex, e.target.value)}
                                  placeholder={`Description ${dIndex + 1}`}
                                  maxLength={90}
                                  rows={2}
                                  className="flex-1 px-3 py-2 text-sm text-gray-900 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                />
                                <span className="text-xs text-gray-500 mt-2 w-12 text-right">{description.length}/90</span>
                                <button
                                  onClick={() => removeDescription(index, dIndex)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Filters */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Filters</span>
                      {hasActiveFilters && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {filteredTableData.length} of {tableData.length} rows
                        </span>
                      )}
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Campaign..."
                      value={filters.campaign}
                      onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                      className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Search headlines..."
                      value={filters.headlines}
                      onChange={(e) => setFilters({ ...filters, headlines: e.target.value })}
                      className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Search descriptions..."
                      value={filters.descriptions}
                      onChange={(e) => setFilters({ ...filters, descriptions: e.target.value })}
                      className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ad Group
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Final URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Path 1
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Path 2
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H1
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H2
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H3
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H4
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H5
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H6
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H7
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H8
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H9
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H10
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H11
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H12
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H13
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H14
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H15
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          D1
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          D2
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          D3
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          D4
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTableData.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                            <input
                              type="text"
                              value={row.campaign}
                              onChange={(e) => updateTableCell(row.id, 'campaign', e.target.value)}
                              className="w-48 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={row.ad_group}
                              onChange={(e) => updateTableCell(row.id, 'ad_group', e.target.value)}
                              className="w-56 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.final_url}
                              onChange={(e) => updateTableCell(row.id, 'final_url', e.target.value)}
                              maxLength={2048}
                              placeholder="https://example.com"
                              className="w-96 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.path_1}
                              onChange={(e) => updateTableCell(row.id, 'path_1', e.target.value)}
                              maxLength={15}
                              placeholder="path1"
                              className="w-32 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.path_2}
                              onChange={(e) => updateTableCell(row.id, 'path_2', e.target.value)}
                              maxLength={15}
                              placeholder="path2"
                              className="w-32 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_1}
                              onChange={(e) => updateTableCell(row.id, 'headline_1', e.target.value)}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_2}
                              onChange={(e) => updateTableCell(row.id, 'headline_2', e.target.value)}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_3}
                              onChange={(e) => updateTableCell(row.id, 'headline_3', e.target.value)}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_4}
                              onChange={(e) => updateTableCell(row.id, 'headline_4', e.target.value)}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_5}
                              onChange={(e) => updateTableCell(row.id, 'headline_5', e.target.value)}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_6}
                              onChange={(e) => updateTableCell(row.id, 'headline_6', e.target.value)}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_7}
                              onChange={(e) => updateTableCell(row.id, 'headline_7', e.target.value)}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_8}
                              onChange={(e) => updateTableCell(row.id, 'headline_8', e.target.value)}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_9}
                              onChange={(e) => updateTableCell(row.id, 'headline_9', e.target.value)}
                              maxLength={30}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_10}
                              onChange={(e) => updateTableCell(row.id, 'headline_10', e.target.value)}
                              maxLength={30}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_11}
                              onChange={(e) => updateTableCell(row.id, 'headline_11', e.target.value)}
                              maxLength={30}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_12}
                              onChange={(e) => updateTableCell(row.id, 'headline_12', e.target.value)}
                              maxLength={30}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_13}
                              onChange={(e) => updateTableCell(row.id, 'headline_13', e.target.value)}
                              maxLength={30}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_14}
                              onChange={(e) => updateTableCell(row.id, 'headline_14', e.target.value)}
                              maxLength={30}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.headline_15}
                              onChange={(e) => updateTableCell(row.id, 'headline_15', e.target.value)}
                              maxLength={30}
                              className="w-64 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.description_1}
                              onChange={(e) => updateTableCell(row.id, 'description_1', e.target.value)}
                              className="w-80 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.description_2}
                              onChange={(e) => updateTableCell(row.id, 'description_2', e.target.value)}
                              className="w-80 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.description_3}
                              onChange={(e) => updateTableCell(row.id, 'description_3', e.target.value)}
                              className="w-80 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={row.description_4}
                              onChange={(e) => updateTableCell(row.id, 'description_4', e.target.value)}
                              maxLength={90}
                              className="w-80 px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {hasActiveFilters ? (
                      <>Showing {filteredTableData.length} of {tableData.length} rows</>
                    ) : (
                      <>{tableData.length} rows</>
                    )} • Click any cell to edit • Click "Save Changes to JSON" to apply edits
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {uploadedFiles.length === 0 && (
          <div className="mt-12 text-center text-gray-500">
            <Eye className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4">Upload JSON files to start visualizing your ad copy</p>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
