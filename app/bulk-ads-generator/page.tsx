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
 <div className="ml-64 min-h-screen bg-[#0a0a0a]">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Header */}
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-white">Prepare Ads</h1>
 <p className="mt-2 text-[#a1a1aa]">
 Bulk edit and generate ad copy, then export to CSV for Google Ads Editor
 </p>
 </div>

 {/* Instructions */}
 {uploadedFiles.length === 0 && (
 <div className="bg-[rgba(239,87,68,0.04)] border border-[#EF5744] rounded-lg p-6 mb-6">
 <h3 className="text-sm font-semibold text-[#EF5744] mb-2">How to use:</h3>
 <ol className="text-sm text-[#EF5744] space-y-1 list-decimal list-inside">
 <li>Upload the <strong>ad copy JSON exported from Step 3 (Ad Copy Builder)</strong></li>
 <li>View your ads in JSON or Table view</li>
 <li>Use Search & Replace to bulk edit headlines and descriptions across all ads</li>
 <li>Edit individual ad copy, URLs, or paths in either view</li>
 <li>Add or remove headlines and descriptions as needed</li>
 <li>Export to CSV to create the Google Ads Editor import template</li>
 <li>Import the CSV file into Google Ads Editor to bulk create ads</li>
 </ol>
 <p className="text-xs text-[#EF5744] mt-3">
 <strong>Tip:</strong> The ad copy JSON from Step 3 contains all your completed ad groups with headlines, descriptions, and URLs.
 This tool lets you make final edits and converts everything to CSV format ready for Google Ads Editor bulk import.
 </p>
 </div>
 )}

 {/* Upload Area */}
 <div
 className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
 isDragging
 ? 'border-[#EF5744] bg-[rgba(239,87,68,0.04)]'
 : 'border-[#2a2a2a] bg-[#141414] hover:border-[#3a3a3a]'
 }`}
 onDrop={handleDrop}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 >
 <Upload className="mx-auto h-12 w-12 text-[#8b8b93]" />
 <div className="mt-4">
 <label htmlFor="file-upload" className="cursor-pointer">
 <span className="text-[#EF5744] hover:text-[#EF5744] font-medium">
 Import Ad Copy JSON
 </span>
 <span className="text-[#a1a1aa]"> or drag and drop</span>
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
 <p className="text-sm text-[#a1a1aa] mt-2">Upload the ad copy JSON from Step 3 (Ad Copy Builder)</p>
 <p className="text-xs text-[#8b8b93] mt-1">Accepts exported ad copy or progress files</p>
 <div className="flex justify-center gap-4 mt-4">
 <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
 <FileJson className="h-4 w-4 text-purple-600" />
 <span className="font-medium">Ad Copy JSON</span>
 </div>
 </div>
 </div>

 {/* Search/Replace Panel */}
 {uploadedFiles.length > 0 && (
 <div className="mt-6 bg-[#141414] rounded-lg shadow-none border border-[#2a2a2a] overflow-hidden">
 <button
 onClick={() => setShowSearchReplace(!showSearchReplace)}
 className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[rgba(255,255,255,0.05)] transition-colors"
 >
 <div className="flex items-center gap-3">
 <Search className="h-5 w-5 text-[#a1a1aa]" />
 <span className="font-semibold text-white">Search & Replace</span>
 {findMatches.count > 0 && (
 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(239,87,68,0.08)] text-[#EF5744]">
 {findMatches.count} {findMatches.count === 1 ? 'match' : 'matches'}
 </span>
 )}
 </div>
 {showSearchReplace ? (
 <ChevronUp className="h-5 w-5 text-[#8b8b93]" />
 ) : (
 <ChevronDown className="h-5 w-5 text-[#8b8b93]" />
 )}
 </button>

 {showSearchReplace && (
 <div className="px-6 py-4 border-t border-[#2a2a2a] space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-[#d4d4d8] mb-2">
 Find
 </label>
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Enter search term or regex"
 className="w-full px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent text-white"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[#d4d4d8] mb-2">
 Replace with
 </label>
 <input
 type="text"
 value={replaceTerm}
 onChange={(e) => setReplaceTerm(e.target.value)}
 placeholder="Enter replacement text"
 className="w-full px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent text-white"
 />
 </div>
 </div>

 <div className="flex flex-wrap gap-4">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={caseSensitive}
 onChange={(e) => setCaseSensitive(e.target.checked)}
 className="rounded border-[#2a2a2a] text-[#EF5744] focus:ring-[#EF5744]"
 />
 <span className="text-sm text-[#d4d4d8]">Case sensitive</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={wholeWord}
 onChange={(e) => setWholeWord(e.target.checked)}
 className="rounded border-[#2a2a2a] text-[#EF5744] focus:ring-[#EF5744]"
 />
 <span className="text-sm text-[#d4d4d8]">Match whole word</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={useRegex}
 onChange={(e) => setUseRegex(e.target.checked)}
 className="rounded border-[#2a2a2a] text-[#EF5744] focus:ring-[#EF5744]"
 />
 <span className="text-sm text-[#d4d4d8]">Use regex</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={highlightMatches}
 onChange={(e) => setHighlightMatches(e.target.checked)}
 className="rounded border-[#2a2a2a] text-[#EF5744] focus:ring-[#EF5744]"
 />
 <span className="text-sm text-[#d4d4d8]">Highlight matches</span>
 </label>
 </div>

 <div className="flex items-center gap-3 pt-2">
 <button
 onClick={handleReplaceAll}
 disabled={!searchTerm || findMatches.count === 0}
 className="flex items-center gap-2 px-4 py-2 bg-[#c93a2a] text-white rounded-lg hover:bg-[#a83020] disabled:bg-[#2a2a2a] disabled:cursor-not-allowed transition-colors"
 >
 <Replace className="h-4 w-4" />
 Replace All ({findMatches.count})
 </button>
 <button
 onClick={handleUndo}
 disabled={history.length === 0}
 className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-[#d4d4d8] rounded-lg hover:bg-[rgba(255,255,255,0.08)] disabled:bg-[#141414] disabled:text-[#8b8b93] disabled:cursor-not-allowed transition-colors"
 >
 <Undo className="h-4 w-4" />
 Undo
 </button>
 {history.length > 0 && (
 <span className="text-sm text-[#8b8b93]">
 {history.length} {history.length === 1 ? 'change' : 'changes'} in history
 </span>
 )}
 </div>

 {useRegex && (
 <div className="text-xs text-[#a1a1aa] bg-[rgba(239,87,68,0.04)] border border-[#EF5744] rounded p-2">
 <strong>Regex mode:</strong> Use patterns like <code className="bg-[#141414] px-1 rounded">ride(s)?</code> or <code className="bg-[#141414] px-1 rounded">\d+</code>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {/* Stats Bar */}
 {uploadedFiles.length > 0 && (
 <>
 <div className="mt-6 bg-[#141414] rounded-lg shadow-none border border-[#2a2a2a] p-4">
 <div className="flex items-center justify-between">
 <div className="flex gap-8">
 <div>
 <p className="text-sm text-[#a1a1aa]">Campaigns</p>
 <p className="text-2xl font-bold text-white">
 {new Set(uploadedFiles.map(ad => ad.campaign)).size}
 </p>
 </div>
 <div>
 <p className="text-sm text-[#a1a1aa]">Ad Groups</p>
 <p className="text-2xl font-bold text-white">{uploadedFiles.length}</p>
 </div>
 <div>
 <p className="text-sm text-[#a1a1aa]">Total Headlines</p>
 <p className="text-2xl font-bold text-white">
 {uploadedFiles.reduce((sum, ad) => sum + (ad.responsive_search_ad?.headlines?.length || 0), 0)}
 </p>
 </div>
 <div>
 <p className="text-sm text-[#a1a1aa]">Total Descriptions</p>
 <p className="text-2xl font-bold text-white">
 {uploadedFiles.reduce((sum, ad) => sum + (ad.responsive_search_ad?.descriptions?.length || 0), 0)}
 </p>
 </div>
 </div>
 <div className="flex gap-2">
 <button
 onClick={exportCombinedJSON}
 className="flex items-center gap-2 px-4 py-2 bg-[#c93a2a] text-white rounded-lg hover:bg-[#a83020] transition-colors"
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
 <div className="flex gap-2 border-b border-[#2a2a2a]">
 <button
 onClick={() => setViewMode('json')}
 className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
 viewMode === 'json'
 ? 'border-[#EF5744] text-[#EF5744]'
 : 'border-transparent text-[#a1a1aa] hover:text-white'
 }`}
 >
 <Grid className="h-4 w-4" />
 JSON View
 </button>
 <button
 onClick={() => setViewMode('table')}
 className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
 viewMode === 'table'
 ? 'border-[#EF5744] text-[#EF5744]'
 : 'border-transparent text-[#a1a1aa] hover:text-white'
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
 className="flex items-center gap-2 px-4 py-2 bg-[#c93a2a] text-white rounded-lg hover:bg-[#a83020] transition-colors text-sm"
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
 className={`bg-[#141414] rounded-lg shadow-none border border-[#2a2a2a] overflow-hidden transition-colors ${
 hasMatch ? 'ring-2 ring-yellow-300' : ''
 }`}
 >
 <div className="bg-gradient-to-r from-[#c93a2a] to-[#a83020] px-6 py-4">
 <div className="flex items-start justify-between">
 <div className="flex-1 mr-4">
 <label className="block text-white/60 text-xs mb-1">Campaign Name</label>
 <input
 type="text"
 value={ad.campaign}
 onChange={(e) => updateCampaignName(index, e.target.value)}
 className="w-full px-3 py-2 text-white bg-[#1a1a1a] bg-opacity-80 border border-[#EF5744] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 {ad.ad_group && (
 <p className="text-white/60 text-sm font-medium mt-2">
 Ad Group: {ad.ad_group}
 </p>
 )}
 {ad.fileName && (
 <p className="text-white/60 text-xs mt-1">
 Source: {ad.fileName}
 </p>
 )}
 </div>
 <div className="flex items-center gap-4 text-white text-sm">
 <div className="text-right">
 <p className="text-white/80">Headlines</p>
 <p className="text-xl font-bold">{ad.responsive_search_ad.headlines.length}</p>
 </div>
 <div className="text-right">
 <p className="text-white/80">Descriptions</p>
 <p className="text-xl font-bold">{ad.responsive_search_ad.descriptions.length}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="p-6 space-y-6">
 {/* URL and Paths */}
 <div className="space-y-3">
 <div>
 <label className="block text-sm font-medium text-[#d4d4d8] mb-2">
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
 className="w-full px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <span className="text-xs text-[#8b8b93] mt-1">
 {(ad.responsive_search_ad.final_url || '').length}/2048 characters
 </span>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-[#d4d4d8] mb-2">
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
 className="w-full px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <span className="text-xs text-[#8b8b93] mt-1">
 {(ad.responsive_search_ad.path_1 || '').length}/15 characters
 </span>
 </div>

 <div>
 <label className="block text-sm font-medium text-[#d4d4d8] mb-2">
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
 className="w-full px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <span className="text-xs text-[#8b8b93] mt-1">
 {(ad.responsive_search_ad.path_2 || '').length}/15 characters
 </span>
 </div>
 </div>
 </div>

 {/* Headlines */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <h4 className="text-sm font-semibold text-[#d4d4d8]">Headlines</h4>
 <button
 onClick={() => addHeadline(index)}
 disabled={ad.responsive_search_ad.headlines.length >= 15}
 className="flex items-center gap-1 px-2 py-1 text-xs text-[#EF5744] hover:text-[#EF5744] disabled:text-[#8b8b93] disabled:cursor-not-allowed"
 >
 <Plus className="h-3 w-3" />
 Add Headline
 </button>
 </div>
 <div className="space-y-2">
 {ad.responsive_search_ad.headlines.map((headline, hIndex) => (
 <div key={hIndex} className="flex items-start gap-2">
 <span className="text-[#EF5744] font-medium text-sm mt-2 flex-shrink-0">
 H{hIndex + 1}:
 </span>
 <input
 type="text"
 value={headline}
 onChange={(e) => updateHeadline(index, hIndex, e.target.value)}
 placeholder={`Headline ${hIndex + 1}`}
 maxLength={30}
 className="flex-1 px-3 py-2 text-sm text-white bg-[rgba(239,87,68,0.04)] border border-[#EF5744] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <span className="text-xs text-[#8b8b93] mt-2 w-12 text-right">{headline.length}/30</span>
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
 <h4 className="text-sm font-semibold text-[#d4d4d8]">Descriptions</h4>
 <button
 onClick={() => addDescription(index)}
 disabled={ad.responsive_search_ad.descriptions.length >= 5}
 className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-700 disabled:text-[#8b8b93] disabled:cursor-not-allowed"
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
 className="flex-1 px-3 py-2 text-sm text-white bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
 />
 <span className="text-xs text-[#8b8b93] mt-2 w-12 text-right">{description.length}/90</span>
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
 <div className="bg-[#141414] rounded-lg shadow-none border border-[#2a2a2a] overflow-hidden">
 {/* Filters */}
 <div className="px-6 py-4 bg-[#141414] border-b border-[#2a2a2a]">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <Filter className="h-4 w-4 text-[#a1a1aa]" />
 <span className="text-sm font-medium text-[#d4d4d8]">Filters</span>
 {hasActiveFilters && (
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(239,87,68,0.08)] text-[#EF5744]">
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
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <input
 type="text"
 placeholder="Search headlines..."
 value={filters.headlines}
 onChange={(e) => setFilters({ ...filters, headlines: e.target.value })}
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <input
 type="text"
 placeholder="Search descriptions..."
 value={filters.descriptions}
 onChange={(e) => setFilters({ ...filters, descriptions: e.target.value })}
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-[#2a2a2a]">
 <thead className="bg-[#141414]">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider sticky left-0 bg-[#141414] z-10">
 Campaign
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Ad Group
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Final URL
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Path 1
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Path 2
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H1
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H2
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H3
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H4
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H5
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H6
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H7
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H8
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H9
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H10
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H11
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H12
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H13
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H14
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 H15
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 D1
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 D2
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 D3
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 D4
 </th>
 </tr>
 </thead>
 <tbody className="bg-[#141414] divide-y divide-[#2a2a2a]">
 {filteredTableData.map((row) => (
 <tr key={row.id} className="hover:bg-[rgba(255,255,255,0.05)]">
 <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-[#141414] z-10">
 <input
 type="text"
 value={row.campaign}
 onChange={(e) => updateTableCell(row.id, 'campaign', e.target.value)}
 className="w-48 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <input
 type="text"
 value={row.ad_group}
 onChange={(e) => updateTableCell(row.id, 'ad_group', e.target.value)}
 className="w-56 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.final_url}
 onChange={(e) => updateTableCell(row.id, 'final_url', e.target.value)}
 maxLength={2048}
 placeholder="https://example.com"
 className="w-96 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.path_1}
 onChange={(e) => updateTableCell(row.id, 'path_1', e.target.value)}
 maxLength={15}
 placeholder="path1"
 className="w-32 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.path_2}
 onChange={(e) => updateTableCell(row.id, 'path_2', e.target.value)}
 maxLength={15}
 placeholder="path2"
 className="w-32 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_1}
 onChange={(e) => updateTableCell(row.id, 'headline_1', e.target.value)}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_2}
 onChange={(e) => updateTableCell(row.id, 'headline_2', e.target.value)}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_3}
 onChange={(e) => updateTableCell(row.id, 'headline_3', e.target.value)}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_4}
 onChange={(e) => updateTableCell(row.id, 'headline_4', e.target.value)}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_5}
 onChange={(e) => updateTableCell(row.id, 'headline_5', e.target.value)}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_6}
 onChange={(e) => updateTableCell(row.id, 'headline_6', e.target.value)}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_7}
 onChange={(e) => updateTableCell(row.id, 'headline_7', e.target.value)}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_8}
 onChange={(e) => updateTableCell(row.id, 'headline_8', e.target.value)}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_9}
 onChange={(e) => updateTableCell(row.id, 'headline_9', e.target.value)}
 maxLength={30}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_10}
 onChange={(e) => updateTableCell(row.id, 'headline_10', e.target.value)}
 maxLength={30}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_11}
 onChange={(e) => updateTableCell(row.id, 'headline_11', e.target.value)}
 maxLength={30}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_12}
 onChange={(e) => updateTableCell(row.id, 'headline_12', e.target.value)}
 maxLength={30}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_13}
 onChange={(e) => updateTableCell(row.id, 'headline_13', e.target.value)}
 maxLength={30}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_14}
 onChange={(e) => updateTableCell(row.id, 'headline_14', e.target.value)}
 maxLength={30}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.headline_15}
 onChange={(e) => updateTableCell(row.id, 'headline_15', e.target.value)}
 maxLength={30}
 className="w-64 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.description_1}
 onChange={(e) => updateTableCell(row.id, 'description_1', e.target.value)}
 className="w-80 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.description_2}
 onChange={(e) => updateTableCell(row.id, 'description_2', e.target.value)}
 className="w-80 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.description_3}
 onChange={(e) => updateTableCell(row.id, 'description_3', e.target.value)}
 className="w-80 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.description_4}
 onChange={(e) => updateTableCell(row.id, 'description_4', e.target.value)}
 maxLength={90}
 className="w-80 px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 <div className="px-6 py-4 bg-[#141414] border-t border-[#2a2a2a]">
 <p className="text-sm text-[#a1a1aa]">
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
 <div className="mt-12 text-center text-[#8b8b93]">
 <Eye className="mx-auto h-12 w-12 text-[#8b8b93]" />
 <p className="mt-4">Upload JSON files to start visualizing your ad copy</p>
 </div>
 )}
 </div>
 </div>
 </>
 );
}
