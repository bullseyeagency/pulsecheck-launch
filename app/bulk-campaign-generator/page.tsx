'use client';

import { useState, useMemo } from 'react';
import { Upload, FileJson, FileSpreadsheet, Eye, Download, Search, Replace, Undo, ChevronDown, ChevronUp, Table, Grid, Filter, X } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface AdGroup {
 ad_group: string;
 keywords: string[];
}

interface CampaignData {
 campaign_name: string;
 location: string;
 ad_groups: AdGroup[];
 fileName?: string;
}

interface TableRow {
 id: string;
 campaignName: string;
 location: string;
 fileName: string;
 adGroup: string;
 adGroupType: string;
 keyword: string;
 matchType: string;
}

export default function BulkCampaignGeneratorPage() {
 const [uploadedFiles, setUploadedFiles] = useState<CampaignData[]>([]);
 const [isDragging, setIsDragging] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [replaceTerm, setReplaceTerm] = useState('');
 const [caseSensitive, setCaseSensitive] = useState(false);
 const [wholeWord, setWholeWord] = useState(false);
 const [useRegex, setUseRegex] = useState(false);
 const [showSearchReplace, setShowSearchReplace] = useState(false);
 const [history, setHistory] = useState<CampaignData[][]>([]);
 const [highlightMatches, setHighlightMatches] = useState(true);
 const [viewMode, setViewMode] = useState<'json' | 'table'>('json');
 const [filters, setFilters] = useState({
 campaignName: '',
 location: '',
 adGroup: '',
 adGroupType: '',
 keyword: '',
 matchType: '',
 });

 const handleFileUpload = async (files: FileList) => {
 const newCampaigns: CampaignData[] = [];

 for (const file of Array.from(files)) {
 const fileType = file.name.split('.').pop()?.toLowerCase();

 if (fileType === 'json') {
 try {
 const text = await file.text();
 const data = JSON.parse(text);

 // Handle both single campaign objects and arrays of campaigns
 if (Array.isArray(data)) {
 // Multiple campaigns in one file (combined JSON)
 data.forEach((campaign: CampaignData) => {
 newCampaigns.push({
 ...campaign,
 fileName: file.name,
 });
 });
 } else {
 // Single campaign object
 newCampaigns.push({
 ...data,
 fileName: file.name,
 });
 }
 } catch (error) {
 console.error(`Error parsing ${file.name}:`, error);
 alert(`Failed to parse ${file.name}. Please check the file format.`);
 }
 } else if (fileType === 'csv') {
 // CSV parsing will be implemented later
 alert('CSV support coming soon!');
 }
 }

 setUploadedFiles([...uploadedFiles, ...newCampaigns]);
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

 const getTotalKeywords = (campaign: CampaignData) => {
 return campaign.ad_groups.reduce((sum, group) => sum + group.keywords.length, 0);
 };

 const getMatchType = (keyword: string): 'exact' | 'phrase' | 'broad' => {
 if (keyword.startsWith('[') && keyword.endsWith(']')) {
 return 'exact';
 } else if (keyword.startsWith('"') && keyword.endsWith('"')) {
 return 'phrase';
 }
 return 'broad';
 };

 const getMatchTypeBadge = (type: 'exact' | 'phrase' | 'broad') => {
 const styles = {
 exact: 'bg-purple-100 text-purple-800 border-purple-200',
 phrase: 'bg-green-100 text-green-800 border-green-200',
 broad: 'bg-orange-100 text-orange-800 border-orange-200',
 };
 const labels = {
 exact: 'Exact',
 phrase: 'Phrase',
 broad: 'Broad',
 };
 return (
 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[type]}`}>
 {labels[type]}
 </span>
 );
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
 a.download = 'combined-campaigns.json';
 a.click();
 URL.revokeObjectURL(url);
 };

 const exportSingleCampaign = (campaign: CampaignData) => {
 const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `${campaign.campaign_name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
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
 const matches: Array<{ campaignIndex: number; adGroupIndex: number; keywordIndex: number }> = [];

 uploadedFiles.forEach((campaign, cIndex) => {
 campaign.ad_groups.forEach((adGroup, agIndex) => {
 adGroup.keywords.forEach((keyword, kwIndex) => {
 const matchCount = (keyword.match(pattern) || []).length;
 if (matchCount > 0) {
 count += matchCount;
 matches.push({
 campaignIndex: cIndex,
 adGroupIndex: agIndex,
 keywordIndex: kwIndex,
 });
 }
 });
 });
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

 // Save current state for undo
 setHistory([...history, JSON.parse(JSON.stringify(uploadedFiles))]);

 const updated = uploadedFiles.map(campaign => ({
 ...campaign,
 ad_groups: campaign.ad_groups.map(adGroup => ({
 ...adGroup,
 keywords: adGroup.keywords.map(keyword => keyword.replace(pattern, replaceTerm)),
 })),
 }));

 setUploadedFiles(updated);
 };

 const handleUndo = () => {
 if (history.length === 0) return;
 const previous = history[history.length - 1];
 setUploadedFiles(previous);
 setHistory(history.slice(0, -1));
 };

 const isKeywordMatch = (keyword: string): boolean => {
 if (!searchTerm || !highlightMatches) return false;
 const pattern = createSearchPattern(searchTerm);
 return pattern ? pattern.test(keyword) : false;
 };

 // Table conversion functions
 const getAdGroupType = (adGroupName: string): string => {
 if (adGroupName.includes('Core')) return 'Core';
 if (adGroupName.includes('City')) return 'City';
 if (adGroupName.includes('Near Me')) return 'Near Me';
 return 'Other';
 };

 const jsonToTableRows = useMemo((): TableRow[] => {
 const rows: TableRow[] = [];
 uploadedFiles.forEach((campaign) => {
 campaign.ad_groups.forEach((adGroup) => {
 adGroup.keywords.forEach((keyword) => {
 rows.push({
 id: `${campaign.campaign_name}-${adGroup.ad_group}-${keyword}`,
 campaignName: campaign.campaign_name,
 location: campaign.location,
 fileName: campaign.fileName || '',
 adGroup: adGroup.ad_group,
 adGroupType: getAdGroupType(adGroup.ad_group),
 keyword: keyword,
 matchType: getMatchType(keyword),
 });
 });
 });
 });
 return rows;
 }, [uploadedFiles]);

 const [tableData, setTableData] = useState<TableRow[]>([]);

 // Update table data when JSON changes
 useMemo(() => {
 setTableData(jsonToTableRows);
 }, [jsonToTableRows]);

 // Filter table data
 const filteredTableData = useMemo(() => {
 return tableData.filter((row) => {
 const matchesCampaign = row.campaignName.toLowerCase().includes(filters.campaignName.toLowerCase());
 const matchesLocation = row.location.toLowerCase().includes(filters.location.toLowerCase());
 const matchesAdGroup = row.adGroup.toLowerCase().includes(filters.adGroup.toLowerCase());
 const matchesAdGroupType = filters.adGroupType === '' || row.adGroupType === filters.adGroupType;
 const matchesKeyword = row.keyword.toLowerCase().includes(filters.keyword.toLowerCase());
 const matchesMatchType = filters.matchType === '' || row.matchType === filters.matchType;

 return matchesCampaign && matchesLocation && matchesAdGroup && matchesAdGroupType && matchesKeyword && matchesMatchType;
 });
 }, [tableData, filters]);

 const clearFilters = () => {
 setFilters({
 campaignName: '',
 location: '',
 adGroup: '',
 adGroupType: '',
 keyword: '',
 matchType: '',
 });
 };

 const hasActiveFilters = Object.values(filters).some(f => f !== '');

 const updateTableCell = (rowId: string, field: keyof TableRow, value: string) => {
 setTableData(
 tableData.map((row) =>
 row.id === rowId ? { ...row, [field]: value } : row
 )
 );
 };

 const tableToJSON = (): CampaignData[] => {
 const campaignMap = new Map<string, CampaignData>();

 tableData.forEach((row) => {
 const key = row.campaignName;
 if (!campaignMap.has(key)) {
 campaignMap.set(key, {
 campaign_name: row.campaignName,
 location: row.location,
 fileName: row.fileName,
 ad_groups: [],
 });
 }

 const campaign = campaignMap.get(key)!;
 let adGroup = campaign.ad_groups.find((ag) => ag.ad_group === row.adGroup);
 if (!adGroup) {
 adGroup = { ad_group: row.adGroup, keywords: [] };
 campaign.ad_groups.push(adGroup);
 }

 if (!adGroup.keywords.includes(row.keyword)) {
 adGroup.keywords.push(row.keyword);
 }
 });

 return Array.from(campaignMap.values());
 };

 const syncTableToJSON = () => {
 setHistory([...history, JSON.parse(JSON.stringify(uploadedFiles))]);
 setUploadedFiles(tableToJSON());
 };

 const escapeCsvValue = (value: string): string => {
 // Escape quotes by doubling them, then wrap in quotes
 return `"${value.replace(/"/g, '""')}"`;
 };

 const exportToCSV = () => {
 const dataToExport = hasActiveFilters ? filteredTableData : tableData;
 const headers = ['Campaign Name', 'Location', 'File Name', 'Ad Group', 'Ad Group Type', 'Keyword', 'Match Type'];
 const csvRows = [
 headers.join(','),
 ...dataToExport.map((row) =>
 [
 escapeCsvValue(row.campaignName),
 escapeCsvValue(row.location),
 escapeCsvValue(row.fileName),
 escapeCsvValue(row.adGroup),
 escapeCsvValue(row.adGroupType),
 escapeCsvValue(row.keyword),
 escapeCsvValue(row.matchType),
 ].join(',')
 ),
 ];

 const csvContent = csvRows.join('\n');
 const blob = new Blob([csvContent], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `campaigns-export${hasActiveFilters ? '-filtered' : ''}.csv`;
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
 <h1 className="text-3xl font-bold text-white">Prepare Campaigns</h1>
 <p className="mt-2 text-[#a1a1aa]">
 Import JSON templates to create campaigns, edit keywords, and export to CSV for Google Ads Editor
 </p>
 </div>

 {/* Instructions */}
 {uploadedFiles.length === 0 && (
 <div className="bg-[rgba(239,87,68,0.04)] border border-[#EF5744] rounded-lg p-6 mb-6">
 <h3 className="text-sm font-semibold text-[#EF5744] mb-2">How to use:</h3>
 <ol className="text-sm text-[#EF5744] space-y-1 list-decimal list-inside">
 <li>Upload the <strong>merged campaign JSON from Step 2 (Merge JSON)</strong></li>
 <li>View your campaigns in JSON or Table view</li>
 <li>Use Search & Replace to bulk edit keywords across all campaigns</li>
 <li>Edit individual keywords, campaign names, or ad groups in Table view</li>
 <li>Export to CSV to create the Google Ads Editor import template</li>
 <li>Import the CSV file into Google Ads Editor to bulk create campaigns</li>
 </ol>
 <p className="text-xs text-[#EF5744] mt-3">
 <strong>Tip:</strong> The merged JSON from Step 2 contains all your campaigns across locations.
 This tool converts that JSON into a CSV format ready for Google Ads Editor bulk import.
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
 Import Merged JSON
 </span>
 <span className="text-[#a1a1aa]"> or drag and drop</span>
 </label>
 <input
 id="file-upload"
 type="file"
 multiple
 accept=".json,.csv"
 className="hidden"
 onChange={handleFileSelect}
 />
 </div>
 <p className="text-sm text-[#a1a1aa] mt-2">Upload the merged campaign JSON from Step 2</p>
 <p className="text-xs text-[#8b8b93] mt-1">Supports multiple files • JSON or CSV</p>
 <div className="flex justify-center gap-4 mt-4">
 <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
 <FileJson className="h-4 w-4 text-green-600" />
 <span className="font-medium">JSON Templates</span>
 </div>
 <div className="flex items-center gap-2 text-sm text-[#8b8b93]">
 <FileSpreadsheet className="h-4 w-4" />
 <span>CSV (coming soon)</span>
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
 {/* Search/Replace Inputs */}
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

 {/* Options */}
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

 {/* Actions */}
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

 {/* Info Messages */}
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
 <p className="text-sm text-[#a1a1aa]">Total Campaigns</p>
 <p className="text-2xl font-bold text-white">{uploadedFiles.length}</p>
 </div>
 <div>
 <p className="text-sm text-[#a1a1aa]">Total Ad Groups</p>
 <p className="text-2xl font-bold text-white">
 {uploadedFiles.reduce((sum, c) => sum + c.ad_groups.length, 0)}
 </p>
 </div>
 <div>
 <p className="text-sm text-[#a1a1aa]">Total Keywords</p>
 <p className="text-2xl font-bold text-white">
 {uploadedFiles.reduce((sum, c) => sum + getTotalKeywords(c), 0)}
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

 {/* Match Type Legend */}
 <div className="mt-4 bg-[#141414] rounded-lg shadow-none border border-[#2a2a2a] p-4">
 <div className="flex items-center gap-6">
 <p className="text-sm font-medium text-[#d4d4d8]">Match Types:</p>
 <div className="flex items-center gap-2">
 {getMatchTypeBadge('exact')}
 <span className="text-xs text-[#a1a1aa]">[keyword]</span>
 </div>
 <div className="flex items-center gap-2">
 {getMatchTypeBadge('phrase')}
 <span className="text-xs text-[#a1a1aa]">"keyword"</span>
 </div>
 <div className="flex items-center gap-2">
 {getMatchTypeBadge('broad')}
 <span className="text-xs text-[#a1a1aa]">keyword</span>
 </div>
 </div>
 </div>
 </>
 )}

 {/* Campaign Visualizer */}
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
 {uploadedFiles.map((campaign, index) => (
 <div key={index} className="bg-[#141414] rounded-lg shadow-none border border-[#2a2a2a] overflow-hidden">
 {/* Campaign Header */}
 <div className="bg-gradient-to-r from-[#c93a2a] to-[#a83020] px-6 py-4">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <h3 className="text-lg font-semibold text-white">
 {campaign.campaign_name}
 </h3>
 <p className="text-white/80 text-sm mt-1">{campaign.location}</p>
 {campaign.fileName && (
 <p className="text-white/60 text-xs mt-1">
 Source: {campaign.fileName}
 </p>
 )}
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-4 text-white text-sm">
 <div className="text-right">
 <p className="text-white/80">Ad Groups</p>
 <p className="text-xl font-bold">{campaign.ad_groups.length}</p>
 </div>
 <div className="text-right">
 <p className="text-white/80">Keywords</p>
 <p className="text-xl font-bold">{getTotalKeywords(campaign)}</p>
 </div>
 </div>
 <button
 onClick={() => exportSingleCampaign(campaign)}
 className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm border border-white/20"
 title="Download as JSON template"
 >
 <Download className="h-4 w-4" />
 <span className="hidden sm:inline">Template</span>
 </button>
 </div>
 </div>
 </div>

 {/* Ad Groups */}
 <div className="divide-y divide-[#2a2a2a]">
 {campaign.ad_groups.map((adGroup, adIndex) => (
 <div key={adIndex} className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div>
 <h4 className="text-base font-semibold text-white">
 {adGroup.ad_group}
 </h4>
 <p className="text-sm text-[#8b8b93] mt-1">
 {adGroup.keywords.length} keywords
 </p>
 </div>
 <div className="text-right">
 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[rgba(239,87,68,0.08)] text-[#EF5744]">
 {adGroup.ad_group.includes('Core')
 ? 'Core'
 : adGroup.ad_group.includes('City')
 ? 'City'
 : adGroup.ad_group.includes('Near Me')
 ? 'Near Me'
 : 'Other'}
 </span>
 <p className="text-xs text-[#8b8b93] mt-1 italic">
 {adGroup.ad_group.includes('Core')
 ? 'Broad + Exact'
 : adGroup.ad_group.includes('City')
 ? 'Exact + Phrase'
 : adGroup.ad_group.includes('Near Me')
 ? 'Phrase only'
 : ''}
 </p>
 </div>
 </div>

 {/* Keywords Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
 {adGroup.keywords.map((keyword, kwIndex) => {
 const matchType = getMatchType(keyword);
 const hasMatch = isKeywordMatch(keyword);
 return (
 <div
 key={kwIndex}
 className={`px-3 py-2 rounded text-sm border flex items-start justify-between gap-2 transition-colors ${
 hasMatch
 ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200'
 : 'bg-[#141414] border-[#2a2a2a]'
 }`}
 >
 <span className="text-[#d4d4d8] font-mono flex-1">{keyword}</span>
 {getMatchTypeBadge(matchType)}
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
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
 <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
 <input
 type="text"
 placeholder="Campaign..."
 value={filters.campaignName}
 onChange={(e) => setFilters({ ...filters, campaignName: e.target.value })}
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <input
 type="text"
 placeholder="Location..."
 value={filters.location}
 onChange={(e) => setFilters({ ...filters, location: e.target.value })}
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <input
 type="text"
 placeholder="Ad Group..."
 value={filters.adGroup}
 onChange={(e) => setFilters({ ...filters, adGroup: e.target.value })}
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <select
 value={filters.adGroupType}
 onChange={(e) => setFilters({ ...filters, adGroupType: e.target.value })}
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 >
 <option value="">All Types</option>
 <option value="Core">Core</option>
 <option value="City">City</option>
 <option value="Near Me">Near Me</option>
 <option value="Other">Other</option>
 </select>
 <input
 type="text"
 placeholder="Keyword..."
 value={filters.keyword}
 onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 <select
 value={filters.matchType}
 onChange={(e) => setFilters({ ...filters, matchType: e.target.value })}
 className="px-3 py-2 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 >
 <option value="">All Matches</option>
 <option value="exact">Exact</option>
 <option value="phrase">Phrase</option>
 <option value="broad">Broad</option>
 </select>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-[#2a2a2a]">
 <thead className="bg-[#141414]">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Campaign Name
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Location
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Ad Group
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Type
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Keyword
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase tracking-wider">
 Match
 </th>
 </tr>
 </thead>
 <tbody className="bg-[#141414] divide-y divide-[#2a2a2a]">
 {filteredTableData.map((row) => (
 <tr key={row.id} className="hover:bg-[rgba(255,255,255,0.05)]">
 <td className="px-6 py-4 whitespace-nowrap">
 <input
 type="text"
 value={row.campaignName}
 onChange={(e) => updateTableCell(row.id, 'campaignName', e.target.value)}
 className="w-full px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <input
 type="text"
 value={row.location}
 onChange={(e) => updateTableCell(row.id, 'location', e.target.value)}
 className="w-full px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <input
 type="text"
 value={row.adGroup}
 onChange={(e) => updateTableCell(row.id, 'adGroup', e.target.value)}
 className="w-full px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent"
 />
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b8b93]">
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
 row.adGroupType === 'Core' ? 'bg-[rgba(239,87,68,0.08)] text-[#EF5744]' :
 row.adGroupType === 'City' ? 'bg-green-100 text-green-800' :
 row.adGroupType === 'Near Me' ? 'bg-purple-100 text-purple-800' :
 'bg-[#1a1a1a] text-white'
 }`}>
 {row.adGroupType}
 </span>
 </td>
 <td className="px-6 py-4">
 <input
 type="text"
 value={row.keyword}
 onChange={(e) => updateTableCell(row.id, 'keyword', e.target.value)}
 className="w-full px-2 py-1 text-sm text-white bg-[#141414] border border-[#2a2a2a] rounded focus:ring-2 focus:ring-[#EF5744] focus:border-transparent font-mono"
 />
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 {getMatchTypeBadge(row.matchType as 'exact' | 'phrase' | 'broad')}
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
 <p className="mt-4">Upload JSON files to start visualizing your campaigns</p>
 </div>
 )}
 </div>
 </div>
 </>
 );
}
