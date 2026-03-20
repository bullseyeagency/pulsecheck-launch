'use client';

import { useState } from 'react';
import { Upload, FileJson, ChevronDown, ChevronUp, Sparkles, Download, Check, Clock, AlertCircle, Copy, Save } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface KeywordData {
 campaign_name: string;
 location: string;
 ad_groups: {
 ad_group: string;
 keywords: string[];
 }[];
 fileName?: string;
}

interface AdGroupCopy {
 id: string;
 campaign_name: string;
 location: string;
 ad_group: string;
 keywords: string[];
 final_url: string;
 path_1: string;
 path_2: string;
 headlines: string[];
 descriptions: string[];
 status: 'pending' | 'generating' | 'approval' | 'complete';
 expanded: boolean;
 showHeadlines: boolean;
 showDescriptions: boolean;
}

export default function AdCopyBuilderPage() {
 const [uploadedData, setUploadedData] = useState<KeywordData[]>([]);
 const [adGroups, setAdGroups] = useState<AdGroupCopy[]>([]);
 const [isDragging, setIsDragging] = useState(false);
 const [filterView, setFilterView] = useState<'all' | 'pending' | 'approval' | 'complete'>('all');

 const handleFileUpload = async (files: FileList) => {
 const file = files[0];
 if (!file) return;

 try {
 const text = await file.text();
 const data = JSON.parse(text);

 // Check if this is a progress file or keywords file
 if (data.version && data.ad_groups && Array.isArray(data.ad_groups)) {
 // This is a progress file - restore saved work
 const restoredAdGroups: AdGroupCopy[] = data.ad_groups.map((ag: any) => ({
 ...ag,
 expanded: false, // Collapse all on load
 showHeadlines: false,
 showDescriptions: false,
 }));

 setAdGroups(restoredAdGroups);
 alert(`Progress restored! Loaded ${restoredAdGroups.length} ad groups from ${new Date(data.saved_at).toLocaleString()}`);
 } else if (Array.isArray(data)) {
 // This is a keywords file - parse into ad groups
 const keywordData: KeywordData[] = data;
 setUploadedData(keywordData);

 const parsed: AdGroupCopy[] = [];
 keywordData.forEach((campaign) => {
 campaign.ad_groups.forEach((adGroup) => {
 parsed.push({
 id: `${campaign.campaign_name}-${adGroup.ad_group}`,
 campaign_name: campaign.campaign_name,
 location: campaign.location,
 ad_group: adGroup.ad_group,
 keywords: adGroup.keywords,
 final_url: '',
 path_1: '',
 path_2: '',
 headlines: Array(15).fill(''),
 descriptions: Array(4).fill(''),
 status: 'pending',
 expanded: true,
 showHeadlines: false,
 showDescriptions: false,
 });
 });
 });

 setAdGroups(parsed);
 } else {
 throw new Error('Unrecognized file format');
 }
 } catch (error) {
 console.error('Error parsing JSON:', error);
 alert('Failed to parse JSON file. Please upload a valid keywords or progress file.');
 }
 };

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(true);
 };

 const handleDragLeave = () => {
 setIsDragging(false);
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 if (e.dataTransfer.files) {
 handleFileUpload(e.dataTransfer.files);
 }
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files) {
 handleFileUpload(e.target.files);
 }
 };

 const toggleExpanded = (id: string) => {
 setAdGroups(adGroups.map(ag =>
 ag.id === id ? { ...ag, expanded: !ag.expanded } : ag
 ));
 };

 const toggleHeadlines = (id: string) => {
 setAdGroups(adGroups.map(ag =>
 ag.id === id ? { ...ag, showHeadlines: !ag.showHeadlines } : ag
 ));
 };

 const toggleDescriptions = (id: string) => {
 setAdGroups(adGroups.map(ag =>
 ag.id === id ? { ...ag, showDescriptions: !ag.showDescriptions } : ag
 ));
 };

 const updateField = (id: string, field: string, value: string) => {
 setAdGroups(adGroups.map(ag => {
 if (ag.id === id) {
 if (field.startsWith('headline_')) {
 const index = parseInt(field.split('_')[1]) - 1;
 const newHeadlines = [...ag.headlines];
 newHeadlines[index] = value;
 return { ...ag, headlines: newHeadlines };
 } else if (field.startsWith('description_')) {
 const index = parseInt(field.split('_')[1]) - 1;
 const newDescriptions = [...ag.descriptions];
 newDescriptions[index] = value;
 return { ...ag, descriptions: newDescriptions };
 }
 return { ...ag, [field]: value };
 }
 return ag;
 }));
 };

 const generateAI = async (id: string) => {
 // Get current ad group data (synchronously)
 const adGroup = adGroups.find(ag => ag.id === id);
 if (!adGroup) return;

 // Set status to generating using functional update
 setAdGroups(prevGroups =>
 prevGroups.map(ag =>
 ag.id === id ? { ...ag, status: 'generating' as const } : ag
 )
 );

 try {
 // Extract product/service from campaign name
 const nameParts = adGroup.campaign_name.split('|').map(p => p.trim());
 const productService = nameParts[2] || 'Service';

 // Determine ad group type
 const adGroupType = adGroup.ad_group.toLowerCase().includes('core')
 ? 'Core'
 : adGroup.ad_group.toLowerCase().includes('geo')
 ? 'Geo'
 : 'Near Me';

 // Determine default text for dynamic keyword insertion
 let defaultKeywordText = productService;
 if (adGroupType === 'Geo') {
 const locationCode = adGroup.location.split(',')[0].trim();
 defaultKeywordText = `${productService} ${locationCode}`;
 } else if (adGroupType === 'Near Me') {
 defaultKeywordText = `${productService} Near Me`;
 }

 // Truncate default text if too long (max 30 chars total, including {Keyword:})
 const maxDefaultLength = 30 - 10; // 10 chars for "{Keyword:}"
 if (defaultKeywordText.length > maxDefaultLength) {
 defaultKeywordText = defaultKeywordText.substring(0, maxDefaultLength);
 }

 // Build the prompt
 const prompt = `You are a Google Ads expert copywriter specializing in local service businesses.

CONTEXT:
- Service: ${productService}
- Location: ${adGroup.location}
- Ad Group Type: ${adGroupType} (${
 adGroupType === 'Core' ? 'product benefits' :
 adGroupType === 'Geo' ? 'location-focused' :
 'convenience-focused'
})
- Keywords: ${adGroup.keywords.slice(0, 10).join(', ')}${adGroup.keywords.length > 10 ? '...' : ''}

TASK:
Generate Google Ads Responsive Search Ad copy.

CRITICAL REQUIREMENTS - YOU MUST FOLLOW EXACTLY:
1. Generate EXACTLY 15 headlines (not 14, not 16 - EXACTLY 15)
2. Generate EXACTLY 4 descriptions (not 3, not 5 - EXACTLY 4)
3. Return ONLY valid JSON, no other text before or after

HEADLINE REQUIREMENTS:

HEADLINE #1 - Dynamic Keyword Insertion (MANDATORY):
 - MUST be exactly: {Keyword:${defaultKeywordText}}
 - Do NOT modify this format or structure

HEADLINES #2 through #15 - Generate 14 more unique headlines:
 - Each max 30 characters including spaces
 - For ${adGroupType} ad group:${
 adGroupType === 'Core'
 ? '\n * Focus on product benefits, features, value\n * Examples: "Giant Water Slides", "Safe & Clean Equipment"'
 : adGroupType === 'Geo'
 ? '\n * Emphasize local relevance, use location name\n * Examples: "Austin Water Slide Delivery", "Trusted in Austin"'
 : '\n * Focus on convenience, proximity\n * Examples: "Water Slides Near You", "Quick Delivery Nearby"'
 }
 - Include CTAs, benefits, trust signals
 - Mix different angles (value, speed, quality, social proof)
 - COUNT CAREFULLY: You need to generate 14 headlines AFTER headline #1

DESCRIPTION REQUIREMENTS:
- Generate EXACTLY 4 unique descriptions
- Each max 90 characters including spaces
- Expand on benefits mentioned in headlines
- Include clear call-to-action
- Mention location for ${adGroupType === 'Geo' ? 'local relevance' : 'trust'}
- Stay compliant with Google Ads policies

COMPLIANCE:
- No excessive punctuation (max 1 exclamation mark per headline)
- No ALL CAPS except acronyms
- No unrealistic claims
- Professional, enthusiastic tone

OUTPUT FORMAT (STRICT):
{
 "headlines": [
 "{Keyword:${defaultKeywordText}}",
 "Headline 2",
 "Headline 3",
 "Headline 4",
 "Headline 5",
 "Headline 6",
 "Headline 7",
 "Headline 8",
 "Headline 9",
 "Headline 10",
 "Headline 11",
 "Headline 12",
 "Headline 13",
 "Headline 14",
 "Headline 15"
 ],
 "descriptions": [
 "Description 1",
 "Description 2",
 "Description 3",
 "Description 4"
 ]
}

REMINDER: Count your headlines before responding. You MUST have EXACTLY 15 headlines in the array.`;

 // Call OpenAI API
 const response = await fetch('/api/generate-ad-copy', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ prompt }),
 });

 if (!response.ok) {
 const errorData = await response.json().catch(() => ({}));
 const errorMessage = errorData.error || `API returned ${response.status}`;
 throw new Error(errorMessage);
 }

 const data = await response.json();

 // Update ad group with generated copy and set to approval using functional update
 setAdGroups(prevGroups =>
 prevGroups.map(ag => {
 if (ag.id === id) {
 return {
 ...ag,
 headlines: data.headlines || ag.headlines,
 descriptions: data.descriptions || ag.descriptions,
 status: 'approval' as const,
 };
 }
 return ag;
 })
 );

 } catch (error) {
 console.error('Error generating ad copy:', error);
 const errorMessage = error instanceof Error ? error.message : 'Unknown error';
 alert(`Failed to generate ad copy for ${adGroup.ad_group}:\n\n${errorMessage}\n\nPlease try again or enter manually.`);

 // Reset status to pending on error using functional update
 setAdGroups(prevGroups =>
 prevGroups.map(ag =>
 ag.id === id ? { ...ag, status: 'pending' as const } : ag
 )
 );
 }
 };

 const generateAllAI = async () => {
 // Get pending groups from current state (synchronously)
 const pendingGroups = adGroups.filter(ag => ag.status === 'pending');

 if (pendingGroups.length === 0) {
 alert('All ad groups are already complete!');
 return;
 }

 if (!confirm(`Generate AI copy for ${pendingGroups.length} pending ad group${pendingGroups.length > 1 ? 's' : ''}? This will cost approximately $${(pendingGroups.length * 0.002).toFixed(2)}`)) {
 return;
 }

 // Process sequentially to avoid race conditions and rate limits
 for (let i = 0; i < pendingGroups.length; i++) {
 const ag = pendingGroups[i];
 console.log(`Generating ${i + 1}/${pendingGroups.length}: ${ag.ad_group}`);

 try {
 await generateAI(ag.id);
 // Small delay between requests to avoid rate limits
 if (i < pendingGroups.length - 1) {
 await new Promise(resolve => setTimeout(resolve, 1000));
 }
 } catch (error) {
 console.error(`Failed to generate for ${ag.ad_group}:`, error);
 // Continue with next ad group even if one fails
 }
 }

 alert(`Finished generating copy for ${pendingGroups.length} ad group${pendingGroups.length > 1 ? 's' : ''}!`);
 };

 const approveAdGroup = (id: string) => {
 const adGroup = adGroups.find(ag => ag.id === id);
 if (!adGroup) return;

 const validation = validateAdGroup(adGroup);
 if (!validation.isValid) {
 alert(`Cannot approve. Please fix these issues:\n\n${validation.errors.map(e => `• ${e}`).join('\n')}`);
 return;
 }

 setAdGroups(adGroups.map(ag =>
 ag.id === id ? { ...ag, status: 'complete' } : ag
 ));
 };

 const revertToPending = (id: string) => {
 setAdGroups(adGroups.map(ag =>
 ag.id === id ? { ...ag, status: 'pending' } : ag
 ));
 };

 const revertToApproval = (id: string) => {
 setAdGroups(adGroups.map(ag =>
 ag.id === id ? { ...ag, status: 'approval' } : ag
 ));
 };

 const cloneFinalURL = (id: string) => {
 const sourceAdGroup = adGroups.find(ag => ag.id === id);
 if (!sourceAdGroup || !sourceAdGroup.final_url) {
 alert('Please enter a Final URL first');
 return;
 }

 setAdGroups(adGroups.map(ag => ({
 ...ag,
 final_url: sourceAdGroup.final_url,
 })));

 alert(`Final URL copied to all ${adGroups.length} ad groups`);
 };

 const clonePath1 = (id: string) => {
 const sourceAdGroup = adGroups.find(ag => ag.id === id);
 if (!sourceAdGroup || !sourceAdGroup.path_1) {
 alert('Please enter Path 1 first');
 return;
 }

 setAdGroups(adGroups.map(ag => ({
 ...ag,
 path_1: sourceAdGroup.path_1,
 })));

 alert(`Path 1 copied to all ${adGroups.length} ad groups`);
 };

 const clonePath2 = (id: string) => {
 const sourceAdGroup = adGroups.find(ag => ag.id === id);
 if (!sourceAdGroup || !sourceAdGroup.path_2) {
 alert('Please enter Path 2 first');
 return;
 }

 setAdGroups(adGroups.map(ag => ({
 ...ag,
 path_2: sourceAdGroup.path_2,
 })));

 alert(`Path 2 copied to all ${adGroups.length} ad groups`);
 };

 const saveProgress = () => {
 // Save all current work (including incomplete ad groups)
 const progressData = {
 saved_at: new Date().toISOString(),
 version: '1.0',
 ad_groups: adGroups.map(ag => ({
 id: ag.id,
 campaign_name: ag.campaign_name,
 location: ag.location,
 ad_group: ag.ad_group,
 keywords: ag.keywords,
 final_url: ag.final_url,
 path_1: ag.path_1,
 path_2: ag.path_2,
 headlines: ag.headlines,
 descriptions: ag.descriptions,
 status: ag.status,
 })),
 };

 const blob = new Blob([JSON.stringify(progressData, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
 a.download = `ad-copy-progress-${timestamp}.json`;
 a.click();
 URL.revokeObjectURL(url);

 alert('Progress saved! You can re-import this file to continue working later.');
 };

 const exportJSON = () => {
 // Export only completed ad groups in Google Ads format
 const completedGroups = adGroups.filter(ag => ag.status === 'complete');

 if (completedGroups.length === 0) {
 alert('No completed ad groups to export. Mark at least one as complete first.');
 return;
 }

 const output = completedGroups.map(ag => ({
 campaign: ag.campaign_name,
 ad_group: ag.ad_group,
 responsive_search_ad: {
 final_url: ag.final_url,
 path_1: ag.path_1,
 path_2: ag.path_2,
 headlines: ag.headlines.filter(h => h.trim()),
 descriptions: ag.descriptions.filter(d => d.trim()),
 },
 }));

 const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = 'ad-copy-export.json';
 a.click();
 URL.revokeObjectURL(url);
 };

 const getCharCount = (text: string, max: number) => {
 const count = text.length;
 const isValid = count <= max;
 return { count, max, isValid };
 };

 // Helper functions to check individual field validity
 const isFinalUrlInvalid = (adGroup: AdGroupCopy): boolean => {
 if (!adGroup.final_url || !adGroup.final_url.trim()) return true;
 if (!adGroup.final_url.startsWith('http://') && !adGroup.final_url.startsWith('https://')) return true;
 return false;
 };

 const hasEnoughHeadlines = (adGroup: AdGroupCopy): boolean => {
 const filledHeadlines = adGroup.headlines.filter(h => h.trim());
 return filledHeadlines.length >= 3;
 };

 const hasEnoughDescriptions = (adGroup: AdGroupCopy): boolean => {
 const filledDescriptions = adGroup.descriptions.filter(d => d.trim());
 return filledDescriptions.length >= 2;
 };

 const validateAdGroup = (adGroup: AdGroupCopy): { isValid: boolean; errors: string[] } => {
 const errors: string[] = [];

 // Check Final URL
 if (!adGroup.final_url || !adGroup.final_url.trim()) {
 errors.push('Final URL is required');
 } else if (!adGroup.final_url.startsWith('http://') && !adGroup.final_url.startsWith('https://')) {
 errors.push('Final URL must start with http:// or https://');
 }

 // Check Paths
 if (adGroup.path_1 && adGroup.path_1.length > 15) {
 errors.push('Path 1 exceeds 15 characters');
 }
 if (adGroup.path_2 && adGroup.path_2.length > 15) {
 errors.push('Path 2 exceeds 15 characters');
 }

 // Check Headlines - at least 3 required
 const filledHeadlines = adGroup.headlines.filter(h => h.trim());
 if (filledHeadlines.length < 3) {
 errors.push('At least 3 headlines are required');
 }

 // Check headline length
 adGroup.headlines.forEach((h, idx) => {
 if (h.trim() && h.length > 30) {
 errors.push(`Headline ${idx + 1} exceeds 30 characters`);
 }
 });

 // Check Descriptions - at least 2 required
 const filledDescriptions = adGroup.descriptions.filter(d => d.trim());
 if (filledDescriptions.length < 2) {
 errors.push('At least 2 descriptions are required');
 }

 // Check description length
 adGroup.descriptions.forEach((d, idx) => {
 if (d.trim() && d.length > 90) {
 errors.push(`Description ${idx + 1} exceeds 90 characters`);
 }
 });

 return {
 isValid: errors.length === 0,
 errors,
 };
 };

 const getStatusBadge = (status: string) => {
 if (status === 'pending') return <span className="flex items-center gap-1 text-xs text-[#8b8b93]"><Clock className="h-3 w-3" /> Pending</span>;
 if (status === 'generating') return <span className="flex items-center gap-1 text-xs text-[#EF5744]"><Sparkles className="h-3 w-3 animate-pulse" /> Generating...</span>;
 if (status === 'approval') return <span className="flex items-center gap-1 text-xs text-yellow-600"><AlertCircle className="h-3 w-3" /> For Approval</span>;
 if (status === 'complete') return <span className="flex items-center gap-1 text-xs text-green-600"><Check className="h-3 w-3" /> Complete</span>;
 };

 const completedCount = adGroups.filter(ag => ag.status === 'complete').length;
 const approvalCount = adGroups.filter(ag => ag.status === 'approval').length;
 const pendingCount = adGroups.filter(ag => ag.status === 'pending' || ag.status === 'generating').length;
 const totalCount = adGroups.length;

 // Filter ad groups based on view
 const filteredAdGroups = adGroups.filter(ag => {
 if (filterView === 'all') return true;
 if (filterView === 'complete') return ag.status === 'complete';
 if (filterView === 'approval') return ag.status === 'approval';
 if (filterView === 'pending') return ag.status === 'pending' || ag.status === 'generating';
 return true;
 });

 return (
 <>
 <Navbar />
 <div className="ml-64 min-h-screen bg-[#0a0a0a]">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Header */}
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-white">Ad Copy Builder</h1>
 <p className="mt-2 text-[#a1a1aa]">
 Upload keywords JSON, generate AI-powered ad copy, review and export to Google Ads
 </p>
 </div>

 {/* Instructions */}
 {adGroups.length === 0 && (
 <div className="bg-[rgba(239,87,68,0.04)] border border-[#EF5744] rounded-lg p-6 mb-6">
 <h3 className="text-sm font-semibold text-[#EF5744] mb-2">How to use:</h3>
 <ol className="text-sm text-[#EF5744] space-y-1 list-decimal list-inside">
 <li>Upload the <strong>merged campaign JSON from Step 2 (Merge JSON)</strong></li>
 <li>Review the ad groups and keywords extracted from your campaigns</li>
 <li>Click "Generate with AI" to create compliant Google Ads copy for each ad group</li>
 <li>Review and edit the generated headlines (15) and descriptions (4)</li>
 <li>Enter Final URL and display paths for your ads</li>
 <li>Click "Approve & Complete" to mark ad groups as ready</li>
 <li>Use "Save Progress" to save your work and continue later</li>
 <li>Export completed ad copy to JSON for Google Ads import</li>
 </ol>
 <p className="text-xs text-[#EF5744] mt-3">
 <strong>Tip:</strong> The merged JSON should contain all your campaigns from different locations combined into one file.
 Each campaign will be broken down into individual ad groups for copy creation.
 </p>
 </div>
 )}

 {/* Upload Section */}
 {adGroups.length === 0 && (
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
 <FileJson className="mx-auto h-12 w-12 text-[#8b8b93]" />
 <div className="mt-4">
 <label htmlFor="file-upload" className="cursor-pointer">
 <span className="text-[#EF5744] hover:text-[#EF5744] font-medium">
 Upload Keywords JSON
 </span>
 <span className="text-[#a1a1aa]"> or drag and drop</span>
 </label>
 <input
 id="file-upload"
 type="file"
 accept=".json"
 className="hidden"
 onChange={handleFileSelect}
 />
 </div>
 <p className="text-sm text-[#a1a1aa] mt-2">Upload the merged JSON from Step 2 or a keywords file from Campaign Builder</p>
 <p className="text-xs text-[#8b8b93] mt-1">AI will generate compliant ad copy based on your keywords</p>
 </div>
 )}

 {/* Stats Bar */}
 {adGroups.length > 0 && (
 <div className="bg-[#141414] rounded-lg shadow-none border border-[#2a2a2a] p-4 mb-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex gap-8">
 <div>
 <p className="text-sm text-[#a1a1aa]">Total</p>
 <p className="text-2xl font-bold text-white">{totalCount}</p>
 </div>
 <div>
 <p className="text-sm text-[#a1a1aa]">Pending</p>
 <p className="text-2xl font-bold text-[#8b8b93]">{pendingCount}</p>
 </div>
 <div>
 <p className="text-sm text-[#a1a1aa]">For Approval</p>
 <p className="text-2xl font-bold text-yellow-600">{approvalCount}</p>
 </div>
 <div>
 <p className="text-sm text-[#a1a1aa]">Completed</p>
 <p className="text-2xl font-bold text-green-600">{completedCount}</p>
 </div>
 </div>
 <div className="flex gap-2">
 <button
 onClick={generateAllAI}
 disabled={pendingCount === 0}
 className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-[#a83020] disabled:bg-[#2a2a2a] disabled:cursor-not-allowed transition-colors"
 >
 <Sparkles className="h-4 w-4" />
 Generate All Pending ({pendingCount})
 </button>
 <button
 onClick={saveProgress}
 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
 title="Save your work to continue later"
 >
 <Save className="h-4 w-4" />
 Save Progress
 </button>
 <button
 onClick={exportJSON}
 disabled={completedCount === 0}
 className="flex items-center gap-2 px-4 py-2 bg-[#c93a2a] text-white rounded-lg hover:bg-[#a83020] disabled:bg-[#2a2a2a] disabled:cursor-not-allowed transition-colors"
 title="Export completed ad groups for Google Ads"
 >
 <Download className="h-4 w-4" />
 Export Ad Copy JSON ({completedCount})
 </button>
 <button
 onClick={() => setAdGroups([])}
 className="text-sm text-red-600 hover:text-red-700 px-3"
 >
 Clear All
 </button>
 </div>
 </div>
 {/* Filter Tabs */}
 <div className="flex gap-2 border-b border-[#2a2a2a] pt-4">
 <button
 onClick={() => setFilterView('all')}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
 filterView === 'all'
 ? 'border-[#EF5744] text-[#EF5744]'
 : 'border-transparent text-[#a1a1aa] hover:text-white'
 }`}
 >
 All ({totalCount})
 </button>
 <button
 onClick={() => setFilterView('pending')}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
 filterView === 'pending'
 ? 'border-[#2a2a2a] text-[#a1a1aa]'
 : 'border-transparent text-[#a1a1aa] hover:text-white'
 }`}
 >
 Pending ({pendingCount})
 </button>
 <button
 onClick={() => setFilterView('approval')}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
 filterView === 'approval'
 ? 'border-yellow-600 text-yellow-600'
 : 'border-transparent text-[#a1a1aa] hover:text-white'
 }`}
 >
 For Approval ({approvalCount})
 </button>
 <button
 onClick={() => setFilterView('complete')}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
 filterView === 'complete'
 ? 'border-green-600 text-green-600'
 : 'border-transparent text-[#a1a1aa] hover:text-white'
 }`}
 >
 Completed ({completedCount})
 </button>
 </div>
 </div>
 )}

 {/* Ad Group Cards */}
 <div className="space-y-4">
 {filteredAdGroups.map((adGroup) => {
 const validation = validateAdGroup(adGroup);
 return (
 <div key={adGroup.id} className="bg-[#141414] rounded-lg shadow-none border border-[#2a2a2a] overflow-hidden">
 {/* Card Header */}
 <div className="bg-gradient-to-r from-[#c93a2a] to-[#a83020] px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <h3 className="text-lg font-semibold text-white">{adGroup.campaign_name}</h3>
 <p className="text-white/80 text-sm mt-1">{adGroup.ad_group}</p>
 <p className="text-white/60 text-xs mt-1">{adGroup.location} • {adGroup.keywords.length} keywords</p>
 </div>
 <div className="flex items-center gap-3">
 {getStatusBadge(adGroup.status)}
 <button
 onClick={() => toggleExpanded(adGroup.id)}
 className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
 >
 {adGroup.expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
 </button>
 </div>
 </div>
 </div>

 {/* Card Content */}
 {adGroup.expanded && (
 <div className="p-6 space-y-6">
 {/* Keywords Section */}
 <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-4">
 <h4 className="text-sm font-semibold text-white mb-2">Keywords (Context for AI)</h4>
 <div className="flex flex-wrap gap-2">
 {adGroup.keywords.slice(0, 6).map((kw, idx) => (
 <span key={idx} className="px-2 py-1 bg-[rgba(239,87,68,0.08)] text-[#EF5744] rounded text-xs font-mono">
 {kw}
 </span>
 ))}
 {adGroup.keywords.length > 6 && (
 <span className="px-2 py-1 bg-[#1f1f1f] text-[#a1a1aa] rounded text-xs">
 +{adGroup.keywords.length - 6} more
 </span>
 )}
 </div>
 </div>

 {/* URL & Paths */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="md:col-span-3">
 <div className="flex items-center justify-between mb-2">
 <label className="block text-sm font-medium text-[#d4d4d8]">
 Final URL
 </label>
 <button
 onClick={() => cloneFinalURL(adGroup.id)}
 className="flex items-center gap-1 px-2 py-1 text-xs text-[#EF5744] hover:bg-[rgba(239,87,68,0.04)] rounded transition-colors"
 title="Copy this URL to all ad groups"
 >
 <Copy className="h-3 w-3" />
 Clone to All
 </button>
 </div>
 <input
 type="url"
 value={adGroup.final_url}
 onChange={(e) => updateField(adGroup.id, 'final_url', e.target.value)}
 placeholder="https://example.com/waterslides"
 className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent text-white ${
 adGroup.status === 'approval' && isFinalUrlInvalid(adGroup)
 ? 'bg-yellow-50 border-yellow-400'
 : 'border-[#2a2a2a]'
 }`}
 />
 </div>
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="block text-sm font-medium text-[#d4d4d8]">
 Path 1
 </label>
 <button
 onClick={() => clonePath1(adGroup.id)}
 className="flex items-center gap-1 px-2 py-1 text-xs text-[#EF5744] hover:bg-[rgba(239,87,68,0.04)] rounded transition-colors"
 title="Copy this path to all ad groups"
 >
 <Copy className="h-3 w-3" />
 Clone
 </button>
 </div>
 <input
 type="text"
 value={adGroup.path_1}
 onChange={(e) => updateField(adGroup.id, 'path_1', e.target.value)}
 placeholder="waterslides"
 maxLength={15}
 className="w-full px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent text-white"
 />
 </div>
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="block text-sm font-medium text-[#d4d4d8]">
 Path 2
 </label>
 <button
 onClick={() => clonePath2(adGroup.id)}
 className="flex items-center gap-1 px-2 py-1 text-xs text-[#EF5744] hover:bg-[rgba(239,87,68,0.04)] rounded transition-colors"
 title="Copy this path to all ad groups"
 >
 <Copy className="h-3 w-3" />
 Clone
 </button>
 </div>
 <input
 type="text"
 value={adGroup.path_2}
 onChange={(e) => updateField(adGroup.id, 'path_2', e.target.value)}
 placeholder="austin"
 maxLength={15}
 className="w-full px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent text-white"
 />
 </div>
 </div>

 {/* Headlines */}
 <div className={`border rounded-lg ${
 adGroup.status === 'approval' && !hasEnoughHeadlines(adGroup)
 ? 'border-yellow-400 bg-yellow-50'
 : 'border-[#2a2a2a]'
 }`}>
 <button
 onClick={() => toggleHeadlines(adGroup.id)}
 className="w-full px-4 py-3 flex items-center justify-between hover:bg-[rgba(255,255,255,0.05)] transition-colors"
 >
 <span className="text-sm font-semibold text-white">
 Headlines (15) - Max 30 characters each
 {adGroup.status === 'approval' && !hasEnoughHeadlines(adGroup) && (
 <span className="ml-2 text-xs text-yellow-700 font-normal">⚠️ Need at least 3 headlines</span>
 )}
 </span>
 {adGroup.showHeadlines ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
 </button>
 {adGroup.showHeadlines && (
 <div className="p-4 border-t border-[#2a2a2a] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {adGroup.headlines.map((headline, idx) => {
 const charInfo = getCharCount(headline, 30);
 return (
 <div key={idx}>
 <div className="flex items-center justify-between mb-1">
 <label className="text-xs font-medium text-[#a1a1aa]">H{idx + 1}</label>
 <span className={`text-xs ${charInfo.isValid ? 'text-[#8b8b93]' : 'text-red-600'}`}>
 {charInfo.count}/{charInfo.max}
 </span>
 </div>
 <input
 type="text"
 value={headline}
 onChange={(e) => updateField(adGroup.id, `headline_${idx + 1}`, e.target.value)}
 placeholder={`Headline ${idx + 1}`}
 maxLength={30}
 className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent text-white ${
 !charInfo.isValid ? 'border-red-300 bg-red-50' : 'border-[#2a2a2a]'
 }`}
 />
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Descriptions */}
 <div className={`border rounded-lg ${
 adGroup.status === 'approval' && !hasEnoughDescriptions(adGroup)
 ? 'border-yellow-400 bg-yellow-50'
 : 'border-[#2a2a2a]'
 }`}>
 <button
 onClick={() => toggleDescriptions(adGroup.id)}
 className="w-full px-4 py-3 flex items-center justify-between hover:bg-[rgba(255,255,255,0.05)] transition-colors"
 >
 <span className="text-sm font-semibold text-white">
 Descriptions (4) - Max 90 characters each
 {adGroup.status === 'approval' && !hasEnoughDescriptions(adGroup) && (
 <span className="ml-2 text-xs text-yellow-700 font-normal">⚠️ Need at least 2 descriptions</span>
 )}
 </span>
 {adGroup.showDescriptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
 </button>
 {adGroup.showDescriptions && (
 <div className="p-4 border-t border-[#2a2a2a] space-y-3">
 {adGroup.descriptions.map((description, idx) => {
 const charInfo = getCharCount(description, 90);
 return (
 <div key={idx}>
 <div className="flex items-center justify-between mb-1">
 <label className="text-xs font-medium text-[#a1a1aa]">D{idx + 1}</label>
 <span className={`text-xs ${charInfo.isValid ? 'text-[#8b8b93]' : 'text-red-600'}`}>
 {charInfo.count}/{charInfo.max}
 </span>
 </div>
 <textarea
 value={description}
 onChange={(e) => updateField(adGroup.id, `description_${idx + 1}`, e.target.value)}
 placeholder={`Description ${idx + 1}`}
 maxLength={90}
 rows={2}
 className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#EF5744] focus:border-transparent text-white ${
 !charInfo.isValid ? 'border-red-300 bg-red-50' : 'border-[#2a2a2a]'
 }`}
 />
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="flex items-center gap-3 pt-2 flex-wrap">
 {/* Generate/Regenerate Button */}
 {(adGroup.status === 'pending' || adGroup.status === 'approval' || adGroup.status === 'generating') && (
 <button
 onClick={() => generateAI(adGroup.id)}
 disabled={adGroup.status === 'generating'}
 className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-[#a83020] disabled:bg-[#2a2a2a] disabled:cursor-not-allowed transition-colors"
 >
 <Sparkles className="h-4 w-4" />
 {adGroup.status === 'generating' ? 'Generating...' : adGroup.status === 'approval' ? 'Regenerate with AI' : 'Generate with AI'}
 </button>
 )}

 {/* Approve Button (For Approval → Complete) */}
 {adGroup.status === 'approval' && (
 <div className="flex items-center gap-2">
 <button
 onClick={() => approveAdGroup(adGroup.id)}
 disabled={!validation.isValid}
 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-[#2a2a2a] disabled:cursor-not-allowed transition-colors"
 title={!validation.isValid ? validation.errors.join(', ') : 'Approve this ad copy'}
 >
 <Check className="h-4 w-4" />
 Approve & Complete
 </button>
 {!validation.isValid && (
 <span className="text-xs text-red-600 flex items-center gap-1">
 <AlertCircle className="h-3 w-3" />
 {validation.errors.length} issue{validation.errors.length > 1 ? 's' : ''}
 </span>
 )}
 </div>
 )}

 {/* Revert Buttons */}
 {adGroup.status === 'approval' && (
 <button
 onClick={() => revertToPending(adGroup.id)}
 className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors text-sm"
 >
 ← Revert to Pending
 </button>
 )}

 {adGroup.status === 'complete' && (
 <button
 onClick={() => revertToApproval(adGroup.id)}
 className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
 >
 ← Edit (Revert to Approval)
 </button>
 )}
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* Empty State */}
 {adGroups.length === 0 && uploadedData.length === 0 && (
 <div className="mt-12 text-center text-[#8b8b93]">
 <Upload className="mx-auto h-12 w-12 text-[#8b8b93]" />
 <p className="mt-4">Upload a keywords JSON to start creating ad copy</p>
 <p className="text-sm mt-2">Upload the merged JSON from Step 2 or a keywords file from Campaign Builder</p>
 </div>
 )}
 </div>
 </div>
 </>
 );
}
