'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { uploadAndTrainDocument, getDocuments, deleteDocuments } from '@/lib/ragKnowledgeBase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { HiOutlineDocumentText, HiOutlinePhotograph, HiOutlineClock, HiOutlineUpload, HiOutlineTrash, HiOutlineSearch, HiOutlineRefresh, HiOutlineDownload, HiOutlineClipboardCopy, HiOutlineEye, HiOutlineLightningBolt, HiOutlineChevronRight, HiOutlineTag, HiOutlineLink, HiOutlineBookOpen, HiOutlineDatabase, HiOutlineCheck, HiOutlineExclamation, HiOutlineTrendingUp, HiOutlineSparkles } from 'react-icons/hi'

const CONTENT_MANAGER_ID = '69986f8892ed7d63ef102c31'
const GRAPHIC_DESIGNER_ID = '69986f98ce3cbf4cb93869ed'
const RAG_ID = '69986f553dc9e9e52825ad44'

// --- Types ---

interface ContentResult {
  content_title?: string
  content_body?: string
  content_type?: string
  target_audience?: string
  key_takeaways?: string[]
  call_to_action?: string
  hashtags?: string[]
  seo_score?: number
  title_tag?: string
  meta_description?: string
  primary_keywords?: string[]
  secondary_keywords?: string[]
  keyword_density_analysis?: string
  content_improvements?: string[]
  internal_linking_suggestions?: string[]
  heading_suggestions?: string[]
  overall_assessment?: string
}

interface GraphicResult {
  graphic_title?: string
  graphic_description?: string
  design_notes?: string
  graphic_type?: string
  dimensions?: string
  color_palette_used?: string[]
  brand_alignment_notes?: string
  images?: { file_url: string; name?: string; format_type?: string }[]
}

interface CampaignEntry {
  id: string
  title: string
  content_type: string
  date: string
  contentData: ContentResult | null
  graphicData: GraphicResult | null
}

// --- Sample Data ---

const SAMPLE_CONTENT: ContentResult = {
  content_title: 'The Ultimate Guide to AI-Powered Real Estate Marketing in 2025',
  content_body: '## Introduction\n\nThe real estate industry is undergoing a digital revolution. AI-powered marketing tools are transforming how agents connect with buyers and sellers, creating personalized experiences at scale.\n\n### Why AI Marketing Matters for Realtors\n\nIn today\'s competitive landscape, leveraging AI is no longer optional. From automated listing descriptions to predictive analytics, smart agents are using technology to close deals faster.\n\n### Key Strategies\n\n- **Automated Content Creation**: Generate property descriptions, social posts, and email campaigns in seconds\n- **Predictive Lead Scoring**: Identify the hottest prospects using machine learning algorithms\n- **Dynamic Personalization**: Tailor marketing messages to individual buyer preferences\n- **Virtual Staging**: Use AI to furnish empty rooms and enhance property photos\n\n### Getting Started\n\nBegin by auditing your current marketing stack. Identify repetitive tasks that can be automated, then implement AI solutions one at a time for maximum impact.\n\n### Measuring Success\n\nTrack metrics like engagement rate, lead conversion, and time-to-close to quantify the ROI of your AI marketing investments.',
  content_type: 'Blog Post',
  target_audience: 'Realtors',
  key_takeaways: [
    'AI marketing tools save realtors an average of 15 hours per week',
    'Personalized content generates 3x more engagement than generic posts',
    'Virtual staging can reduce time-on-market by up to 40%',
    'Early adopters of AI marketing report 25% higher close rates'
  ],
  call_to_action: 'Ready to transform your real estate marketing? Join the AI Growth Community today and get access to cutting-edge tools that will elevate your business.',
  hashtags: ['#AIMarketing', '#RealEstateTech', '#GrowthCommunity', '#PropTech', '#RealtorLife'],
  seo_score: 82,
  title_tag: 'AI-Powered Real Estate Marketing Guide 2025 | AI Growth Community',
  meta_description: 'Discover how AI marketing tools are revolutionizing real estate. Learn strategies for automated content, predictive analytics, and virtual staging to close more deals.',
  primary_keywords: ['AI real estate marketing', 'AI marketing tools', 'real estate technology'],
  secondary_keywords: ['virtual staging', 'predictive lead scoring', 'automated content creation', 'proptech'],
  keyword_density_analysis: 'Primary keyword "AI real estate marketing" appears 8 times (1.2% density - optimal). Secondary keywords well-distributed across H2 and H3 headings. Consider adding one more mention of "proptech" in the conclusion paragraph.',
  content_improvements: [
    'Add a comparison table of top AI marketing tools for realtors',
    'Include real-world case studies with specific ROI metrics',
    'Add internal links to related community resources',
    'Consider adding an FAQ section for common objections'
  ],
  internal_linking_suggestions: [
    'Link to "Getting Started with AI Tools" tutorial page',
    'Reference the community success stories section',
    'Connect to the AI tools comparison guide'
  ],
  heading_suggestions: [
    'H2: "Top 5 AI Marketing Tools Every Realtor Needs"',
    'H3: "Case Study: How Agent Smith Doubled Leads with AI"',
    'H2: "Future Trends: What\'s Next for AI in Real Estate"'
  ],
  overall_assessment: 'Strong content with clear value proposition. The article effectively addresses the target audience\'s pain points and provides actionable strategies. SEO optimization is above average with well-placed keywords and proper heading hierarchy. Recommended improvements include adding data-driven case studies and expanding the internal linking structure to boost domain authority.'
}

const SAMPLE_GRAPHIC: GraphicResult = {
  graphic_title: 'AI Marketing Mastery - Social Banner',
  graphic_description: 'A sleek, modern social media banner showcasing AI-powered marketing insights with warm heritage tones and professional typography.',
  design_notes: 'Utilized warm amber and cream color palette for brand consistency. Bold serif headings with clean sans-serif body text. Gradient overlay on hero image for text readability.',
  graphic_type: 'Social Banner',
  dimensions: '1200x630',
  color_palette_used: ['#6B3A1F', '#C49A2C', '#F5F0E8', '#2D1A0E', '#D4A843'],
  brand_alignment_notes: 'Design follows Heritage Premium guidelines with serif typography and warm earth tones. Consistent with community brand identity.',
  images: [{ file_url: 'https://placehold.co/1200x630/6B3A1F/F5F0E8?text=AI+Growth+Banner', name: 'ai-marketing-banner.png', format_type: 'png' }]
}

const SAMPLE_CAMPAIGNS: CampaignEntry[] = [
  {
    id: 'sample-1',
    title: 'The Ultimate Guide to AI-Powered Real Estate Marketing in 2025',
    content_type: 'Blog Post',
    date: '2025-02-18',
    contentData: SAMPLE_CONTENT,
    graphicData: SAMPLE_GRAPHIC
  },
  {
    id: 'sample-2',
    title: '5 Quick Tips for Growing Your Real Estate Pipeline',
    content_type: 'Social Post',
    date: '2025-02-17',
    contentData: {
      content_title: '5 Quick Tips for Growing Your Real Estate Pipeline',
      content_body: 'Want more leads? Here are 5 proven strategies:\n\n1. **Leverage AI lead scoring** to focus on high-intent prospects\n2. **Create hyper-local content** that establishes neighborhood expertise\n3. **Automate follow-ups** with personalized email sequences\n4. **Use video tours** to engage remote buyers\n5. **Build referral networks** through community partnerships',
      content_type: 'Social Post',
      target_audience: 'Realtors',
      key_takeaways: ['Focus on quality leads', 'Automate where possible', 'Build local authority'],
      call_to_action: 'Which tip will you try first? Drop a comment below!',
      hashtags: ['#RealEstateTips', '#LeadGen', '#GrowthHacks'],
      seo_score: 74,
      title_tag: '5 Real Estate Pipeline Growth Tips | AI Growth Community',
      meta_description: 'Discover 5 proven strategies to grow your real estate pipeline using AI-powered tools and local marketing expertise.',
      primary_keywords: ['real estate pipeline', 'lead generation tips'],
      secondary_keywords: ['AI lead scoring', 'real estate growth'],
      keyword_density_analysis: 'Good keyword distribution. Primary terms appear in headline and key positions.',
      content_improvements: ['Add specific numbers and data points', 'Include a downloadable checklist'],
      internal_linking_suggestions: ['Link to AI tools page'],
      heading_suggestions: ['Add numbered H3 headings for each tip'],
      overall_assessment: 'Concise, actionable social content that drives engagement through its list format.'
    },
    graphicData: null
  },
  {
    id: 'sample-3',
    title: 'Monthly Newsletter: Market Insights & AI Updates',
    content_type: 'Email Copy',
    date: '2025-02-15',
    contentData: {
      content_title: 'Monthly Newsletter: Market Insights & AI Updates',
      content_body: 'Dear Community Member,\n\nHere is your monthly roundup of the latest AI marketing trends and real estate market insights.\n\n## Market Highlights\n\n- Housing inventory up 12% in key metros\n- AI adoption among agents grew 34% this quarter\n- Virtual tour engagement rates hit all-time highs',
      content_type: 'Email Copy',
      target_audience: 'Both',
      key_takeaways: ['Market is shifting', 'AI adoption growing', 'Virtual tours trending'],
      call_to_action: 'Read the full report in your member dashboard.',
      hashtags: ['#MarketUpdate', '#AIInsights'],
      seo_score: 68,
      title_tag: 'Monthly AI Marketing Newsletter',
      meta_description: 'Stay updated with the latest AI marketing trends and real estate insights.',
      primary_keywords: ['AI marketing newsletter', 'real estate insights'],
      secondary_keywords: ['market trends', 'virtual tours'],
      keyword_density_analysis: 'Adequate keyword usage for email format.',
      content_improvements: ['Add personalization tokens', 'Include click-through CTAs'],
      internal_linking_suggestions: ['Link to dashboard', 'Link to full report'],
      heading_suggestions: ['Add "What\'s New" section heading'],
      overall_assessment: 'Effective email copy with clear structure. Could benefit from more personalization.'
    },
    graphicData: null
  }
]

// --- Markdown Renderer ---

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-serif font-semibold text-sm mt-3 mb-1 tracking-wide">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-serif font-semibold text-base mt-3 mb-1 tracking-wide">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-serif font-bold text-lg mt-4 mb-2 tracking-wide">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm leading-relaxed">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm leading-relaxed">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// --- SEO Score Ring ---

function SeoScoreRing({ score }: { score: number }) {
  const safeScore = typeof score === 'number' ? Math.min(100, Math.max(0, score)) : 0
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (safeScore / 100) * circumference
  const color = safeScore < 40 ? 'hsl(0, 84%, 60%)' : safeScore < 70 ? 'hsl(43, 75%, 38%)' : 'hsl(120, 50%, 40%)'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(35,15%,85%)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold font-serif" style={{ color }}>{safeScore}</span>
        <span className="text-xs text-muted-foreground">SEO Score</span>
      </div>
    </div>
  )
}

// --- Error Boundary ---

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Clipboard Helper ---

function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
  }
  return Promise.resolve(false)
}

// --- Main Page ---

export default function Page() {
  // Navigation
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'asset-studio' | 'campaign-history'>('dashboard')

  // Sample data toggle
  const [showSampleData, setShowSampleData] = useState(false)

  // Content form state
  const [contentForm, setContentForm] = useState({
    topic: '',
    contentType: '',
    audience: '',
    keyMessage: '',
    tone: ''
  })
  const [contentResult, setContentResult] = useState<ContentResult | null>(null)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [contentTab, setContentTab] = useState('content')

  // Graphic form state
  const [graphicForm, setGraphicForm] = useState({
    headline: '',
    graphicType: '',
    aspectRatio: '',
    styleNotes: ''
  })
  const [graphicResults, setGraphicResults] = useState<GraphicResult[]>([])
  const [isGeneratingGraphic, setIsGeneratingGraphic] = useState(false)
  const [graphicError, setGraphicError] = useState<string | null>(null)

  // Campaign history
  const [campaigns, setCampaigns] = useState<CampaignEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignEntry | null>(null)

  // KB state
  const [kbDialogOpen, setKbDialogOpen] = useState(false)
  const [kbDocuments, setKbDocuments] = useState<{ fileName: string; status?: string }[]>([])
  const [kbLoading, setKbLoading] = useState(false)
  const [kbUploadStatus, setKbUploadStatus] = useState<string | null>(null)
  const kbFileRef = useRef<HTMLInputElement>(null)

  // Agent activity
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Copy feedback
  const [copyFeedback, setCopyFeedback] = useState(false)

  // Load campaigns from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aigc_campaigns')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setCampaigns(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Save campaigns to localStorage
  const saveCampaigns = useCallback((newCampaigns: CampaignEntry[]) => {
    setCampaigns(newCampaigns)
    try {
      localStorage.setItem('aigc_campaigns', JSON.stringify(newCampaigns))
    } catch {
      // ignore
    }
  }, [])

  // Fetch KB documents
  const fetchKbDocuments = useCallback(async () => {
    setKbLoading(true)
    try {
      const result = await getDocuments(RAG_ID)
      if (result.success && Array.isArray(result.documents)) {
        setKbDocuments(result.documents.map(d => ({ fileName: d.fileName, status: d.status })))
      }
    } catch {
      // ignore
    }
    setKbLoading(false)
  }, [])

  useEffect(() => {
    if (kbDialogOpen) {
      fetchKbDocuments()
    }
  }, [kbDialogOpen, fetchKbDocuments])

  // Handle content generation
  const handleGenerateContent = useCallback(async () => {
    setIsGeneratingContent(true)
    setContentError(null)
    setContentResult(null)
    setActiveAgentId(CONTENT_MANAGER_ID)
    setContentTab('content')

    const prompt = `Create a ${contentForm.contentType || 'Blog Post'} about "${contentForm.topic}" targeting ${contentForm.audience || 'Realtors'}. Key message: ${contentForm.keyMessage || contentForm.topic}. Tone: ${contentForm.tone || 'Professional'}. Please provide full SEO-optimized content with all SEO analysis fields.`

    try {
      const result = await callAIAgent(prompt, CONTENT_MANAGER_ID)
      setActiveAgentId(null)

      if (result.success && result?.response?.result) {
        const data = result.response.result as ContentResult
        setContentResult(data)

        // Auto-populate graphic headline
        if (data?.content_title) {
          setGraphicForm(prev => ({ ...prev, headline: data.content_title || '' }))
        }

        // Save as campaign
        const newCampaign: CampaignEntry = {
          id: `campaign-${Date.now()}`,
          title: data?.content_title || contentForm.topic || 'Untitled Campaign',
          content_type: data?.content_type || contentForm.contentType || 'Blog Post',
          date: new Date().toISOString().split('T')[0],
          contentData: data,
          graphicData: null
        }
        saveCampaigns([newCampaign, ...campaigns])
      } else {
        setContentError(result?.error || 'Failed to generate content. Please try again.')
      }
    } catch {
      setContentError('An unexpected error occurred. Please try again.')
      setActiveAgentId(null)
    }

    setIsGeneratingContent(false)
  }, [contentForm, campaigns, saveCampaigns])

  // Helper: extract artifact files from any response shape
  const extractArtifactFiles = useCallback((result: any): { file_url: string; name: string; format_type: string }[] => {
    const tryExtract = (obj: any): any[] | null => {
      if (!obj) return null
      if (Array.isArray(obj?.artifact_files) && obj.artifact_files.length > 0) {
        return obj.artifact_files.filter((f: any) => f?.file_url)
      }
      return null
    }
    // Priority 1: top-level module_outputs
    const p1 = tryExtract(result?.module_outputs)
    if (p1 && p1.length > 0) return p1
    // Priority 2: response.module_outputs
    const p2 = tryExtract(result?.response?.module_outputs)
    if (p2 && p2.length > 0) return p2
    // Priority 3: response.result.module_outputs
    const p3 = tryExtract(result?.response?.result?.module_outputs)
    if (p3 && p3.length > 0) return p3
    // Priority 4: direct image_url / file_url in result data
    const data = result?.response?.result || {}
    if (data?.image_url) return [{ file_url: data.image_url, name: 'generated-image', format_type: 'png' }]
    if (data?.file_url) return [{ file_url: data.file_url, name: 'generated-file', format_type: 'png' }]
    // Priority 5: parse raw_response
    if (result?.raw_response) {
      try {
        const raw = typeof result.raw_response === 'string' ? JSON.parse(result.raw_response) : result.raw_response
        const p5 = tryExtract(raw?.module_outputs)
        if (p5 && p5.length > 0) return p5
        // Also check nested: raw.response.module_outputs
        const p5b = tryExtract(raw?.response?.module_outputs)
        if (p5b && p5b.length > 0) return p5b
      } catch {
        // ignore
      }
    }
    return []
  }, [])

  // Handle graphic generation
  const handleGenerateGraphic = useCallback(async () => {
    setIsGeneratingGraphic(true)
    setGraphicError(null)
    setActiveAgentId(GRAPHIC_DESIGNER_ID)

    const prompt = `Create a ${graphicForm.graphicType || 'Social Banner'} graphic with headline "${graphicForm.headline}". Aspect ratio: ${graphicForm.aspectRatio || '16:9 Landscape'}. ${graphicForm.styleNotes ? `Style notes: ${graphicForm.styleNotes}` : ''} Use warm heritage premium brand colors. The graphic should be visually appealing and professional for AI Growth Community marketing.`

    try {
      const result = await callAIAgent(prompt, GRAPHIC_DESIGNER_ID)
      setActiveAgentId(null)

      if (result.success) {
        const data = result?.response?.result || {}
        const artifactFiles = extractArtifactFiles(result)

        const newGraphic: GraphicResult = {
          graphic_title: data?.graphic_title || graphicForm.headline || 'Untitled Graphic',
          graphic_description: data?.graphic_description || '',
          design_notes: data?.design_notes || '',
          graphic_type: data?.graphic_type || graphicForm.graphicType || 'Social Banner',
          dimensions: data?.dimensions || '',
          color_palette_used: Array.isArray(data?.color_palette_used) ? data.color_palette_used : [],
          brand_alignment_notes: data?.brand_alignment_notes || '',
          images: artifactFiles.map((f: { file_url?: string; name?: string; format_type?: string }) => ({
            file_url: f?.file_url || '',
            name: f?.name || 'graphic',
            format_type: f?.format_type || 'png'
          }))
        }
        setGraphicResults(prev => [newGraphic, ...prev])

        // Update most recent campaign with graphic
        if (campaigns.length > 0) {
          const updatedCampaigns = [...campaigns]
          updatedCampaigns[0] = { ...updatedCampaigns[0], graphicData: newGraphic }
          saveCampaigns(updatedCampaigns)
        }
      } else {
        setGraphicError(result?.error || result?.response?.message || 'Failed to generate graphic. Please try again.')
      }
    } catch (err) {
      setGraphicError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setActiveAgentId(null)
    }

    setIsGeneratingGraphic(false)
  }, [graphicForm, campaigns, saveCampaigns, extractArtifactFiles])

  // Handle KB upload - with robust error handling for fetchWrapper returning undefined
  const handleKbUpload = useCallback(async () => {
    const file = kbFileRef.current?.files?.[0]
    if (!file) {
      setKbUploadStatus('Please select a file first.')
      return
    }

    // Validate file type before sending
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const ext = file.name.split('.').pop()?.toLowerCase()
    const extToMime: Record<string, string> = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', txt: 'text/plain' }

    if (!allowedTypes.includes(file.type) && !(ext && extToMime[ext])) {
      setKbUploadStatus('Unsupported file type. Please upload PDF, DOCX, or TXT files only.')
      return
    }

    setKbLoading(true)
    setKbUploadStatus('Uploading document...')
    try {
      const result = await uploadAndTrainDocument(RAG_ID, file)
      if (result && result.success) {
        setKbUploadStatus('Document uploaded and training started successfully.')
        await fetchKbDocuments()
        if (kbFileRef.current) kbFileRef.current.value = ''
      } else {
        setKbUploadStatus(`Upload failed: ${result?.error || 'The server returned an error. Please try again.'}`)
      }
    } catch (err) {
      setKbUploadStatus(`Upload failed: ${err instanceof Error ? err.message : 'Network error. Please check your connection and try again.'}`)
    }
    setKbLoading(false)
  }, [fetchKbDocuments])

  // Handle KB delete
  const handleKbDelete = useCallback(async (fileName: string) => {
    setKbLoading(true)
    try {
      const result = await deleteDocuments(RAG_ID, [fileName])
      if (result.success) {
        await fetchKbDocuments()
      }
    } catch {
      // ignore
    }
    setKbLoading(false)
  }, [fetchKbDocuments])

  // Handle copy
  const handleCopy = useCallback(async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    }
  }, [])

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    const source = showSampleData && campaigns.length === 0 ? SAMPLE_CAMPAIGNS : campaigns
    return source.filter(c => {
      const matchesSearch = !searchQuery || (c.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'All' || c.content_type === filterType
      return matchesSearch && matchesType
    })
  }, [campaigns, searchQuery, filterType, showSampleData])

  // Display data (sample or real)
  const displayContent = showSampleData && !contentResult ? SAMPLE_CONTENT : contentResult
  const displayGraphics = showSampleData && graphicResults.length === 0 ? [SAMPLE_GRAPHIC] : graphicResults

  // Navigation items
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: HiOutlineDocumentText },
    { id: 'asset-studio' as const, label: 'Asset Studio', icon: HiOutlinePhotograph },
    { id: 'campaign-history' as const, label: 'Campaign History', icon: HiOutlineClock }
  ]

  const agents = [
    { id: CONTENT_MANAGER_ID, name: 'Content Marketing Manager', purpose: 'Coordinates content writing and SEO optimization' },
    { id: GRAPHIC_DESIGNER_ID, name: 'Graphic Designer Agent', purpose: 'Generates marketing visuals and graphics' }
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-border/30 flex flex-col flex-shrink-0" style={{ background: 'hsl(35, 25%, 90%)' }}>
          {/* Brand */}
          <div className="p-6 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <HiOutlineLightningBolt className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-base font-semibold tracking-wide text-foreground">AI Growth</h1>
                <p className="text-xs text-muted-foreground">Community Marketing</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = activeScreen === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Knowledge Base */}
          <div className="p-4 border-t border-border/20">
            <Dialog open={kbDialogOpen} onOpenChange={setKbDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-foreground transition-all duration-200">
                  <HiOutlineDatabase className="w-5 h-5 flex-shrink-0" />
                  <span>Knowledge Base</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-serif tracking-wide">Knowledge Base</DialogTitle>
                  <DialogDescription>Upload documents to enhance content quality. Supports PDF, DOCX, and TXT files.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={kbFileRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="flex-1"
                    />
                    <Button onClick={handleKbUpload} disabled={kbLoading} size="sm" className="bg-primary text-primary-foreground">
                      {kbLoading ? (
                        <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                      ) : (
                        <HiOutlineUpload className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {kbUploadStatus && (
                    <p className={cn('text-xs', kbUploadStatus.includes('failed') || kbUploadStatus.includes('Failed') ? 'text-destructive' : 'text-muted-foreground')}>
                      {kbUploadStatus}
                    </p>
                  )}
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Uploaded Documents</Label>
                    {kbDocuments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                    ) : (
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2">
                          {kbDocuments.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-card rounded-md">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <HiOutlineDocumentText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm truncate">{doc.fileName}</span>
                                {doc.status && <Badge variant="secondary" className="text-xs">{doc.status}</Badge>}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleKbDelete(doc.fileName)}
                                disabled={kbLoading}
                                className="flex-shrink-0"
                              >
                                <HiOutlineTrash className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Agent Status */}
          <div className="p-4 border-t border-border/20">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Agents</Label>
            <div className="space-y-2">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-start gap-2">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors', activeAgentId === agent.id ? 'bg-accent animate-pulse' : 'bg-muted-foreground/30')} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{agent.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          {/* Top Bar */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/20 px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-wide">
                {activeScreen === 'dashboard' && 'Content Generation'}
                {activeScreen === 'asset-studio' && 'Asset Studio'}
                {activeScreen === 'campaign-history' && 'Campaign History'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeScreen === 'dashboard' && 'Create SEO-optimized marketing content in one click.'}
                {activeScreen === 'asset-studio' && 'Generate marketing visuals based on your content.'}
                {activeScreen === 'campaign-history' && 'Access and reuse previously generated content and assets.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-sm text-muted-foreground">Sample Data</Label>
              <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={setShowSampleData} />
            </div>
          </div>

          <div className="p-8">
            {/* Dashboard Screen */}
            {activeScreen === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Form (40%) */}
                <div className="lg:col-span-2">
                  <Card className="shadow-md border-border/30">
                    <CardHeader>
                      <CardTitle className="font-serif tracking-wide flex items-center gap-2">
                        <HiOutlineSparkles className="w-5 h-5 text-primary" />
                        Content Brief
                      </CardTitle>
                      <CardDescription>Fill in the details to generate SEO-optimized content.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="topic" className="text-sm font-medium">Topic</Label>
                        <Input
                          id="topic"
                          placeholder="e.g., AI-Powered Real Estate Marketing Strategies"
                          value={contentForm.topic}
                          onChange={(e) => setContentForm(prev => ({ ...prev, topic: e.target.value }))}
                          className="bg-card"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content Type</Label>
                        <Select value={contentForm.contentType} onValueChange={(val) => setContentForm(prev => ({ ...prev, contentType: val }))}>
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Blog Post">Blog Post</SelectItem>
                            <SelectItem value="Social Post">Social Post</SelectItem>
                            <SelectItem value="Email Copy">Email Copy</SelectItem>
                            <SelectItem value="Ad Copy">Ad Copy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Target Audience</Label>
                        <Select value={contentForm.audience} onValueChange={(val) => setContentForm(prev => ({ ...prev, audience: val }))}>
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Realtors">Realtors</SelectItem>
                            <SelectItem value="Small Business">Small Business</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="keyMessage" className="text-sm font-medium">Key Message</Label>
                        <Textarea
                          id="keyMessage"
                          placeholder="What is the core message you want to convey?"
                          value={contentForm.keyMessage}
                          onChange={(e) => setContentForm(prev => ({ ...prev, keyMessage: e.target.value }))}
                          rows={3}
                          className="bg-card resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">{contentForm.keyMessage.length} characters</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tone</Label>
                        <Select value={contentForm.tone} onValueChange={(val) => setContentForm(prev => ({ ...prev, tone: val }))}>
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Conversational">Conversational</SelectItem>
                            <SelectItem value="Educational">Educational</SelectItem>
                            <SelectItem value="Persuasive">Persuasive</SelectItem>
                            <SelectItem value="Inspiring">Inspiring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={handleGenerateContent}
                        disabled={isGeneratingContent || !contentForm.topic}
                        className="w-full bg-primary text-primary-foreground hover:opacity-90 font-medium"
                      >
                        {isGeneratingContent ? (
                          <span className="flex items-center gap-2">
                            <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                            Crafting your content...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <HiOutlineSparkles className="w-4 h-4" />
                            Generate Content
                          </span>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Right: Output (60%) */}
                <div className="lg:col-span-3">
                  {contentError && (
                    <Card className="shadow-md border-destructive/50 mb-4">
                      <CardContent className="py-4 flex items-center gap-3">
                        <HiOutlineExclamation className="w-5 h-5 text-destructive flex-shrink-0" />
                        <p className="text-sm text-destructive flex-1">{contentError}</p>
                        <Button variant="ghost" size="sm" onClick={handleGenerateContent}>
                          <HiOutlineRefresh className="w-4 h-4 mr-1" /> Retry
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {isGeneratingContent ? (
                    <Card className="shadow-md border-border/30">
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex items-center gap-3 pt-4">
                          <HiOutlineRefresh className="w-5 h-5 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Crafting your content...</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : displayContent ? (
                    <Card className="shadow-md border-border/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="font-serif text-xl tracking-wide leading-relaxed">
                              {displayContent?.content_title || 'Generated Content'}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              {displayContent?.content_type && <Badge variant="secondary">{displayContent.content_type}</Badge>}
                              {displayContent?.target_audience && <Badge variant="outline">{displayContent.target_audience}</Badge>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(displayContent?.content_body || '')}
                            className="flex-shrink-0"
                          >
                            {copyFeedback ? <HiOutlineCheck className="w-4 h-4 text-accent" /> : <HiOutlineClipboardCopy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={contentTab} onValueChange={setContentTab} className="w-full">
                          <TabsList className="mb-4">
                            <TabsTrigger value="content" className="flex items-center gap-1.5">
                              <HiOutlineBookOpen className="w-4 h-4" /> Content
                            </TabsTrigger>
                            <TabsTrigger value="seo" className="flex items-center gap-1.5">
                              <HiOutlineTrendingUp className="w-4 h-4" /> SEO Analysis
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="content">
                            <ScrollArea className="max-h-[600px] pr-4">
                              <div className="space-y-6">
                                {/* Content Body */}
                                <div className="prose-sm">
                                  {renderMarkdown(displayContent?.content_body || '')}
                                </div>

                                {/* Key Takeaways */}
                                {(Array.isArray(displayContent?.key_takeaways) && displayContent.key_takeaways.length > 0) && (
                                  <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                                    <h4 className="font-serif font-semibold text-sm tracking-wide flex items-center gap-2">
                                      <HiOutlineLightningBolt className="w-4 h-4 text-accent" />
                                      Key Takeaways
                                    </h4>
                                    <ul className="space-y-1.5">
                                      {displayContent.key_takeaways.map((takeaway, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                                          <HiOutlineChevronRight className="w-3 h-3 mt-1.5 text-primary flex-shrink-0" />
                                          <span>{takeaway}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Call to Action */}
                                {displayContent?.call_to_action && (
                                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                                    <h4 className="font-serif font-semibold text-sm tracking-wide mb-2">Call to Action</h4>
                                    <p className="text-sm leading-relaxed">{displayContent.call_to_action}</p>
                                  </div>
                                )}

                                {/* Hashtags */}
                                {(Array.isArray(displayContent?.hashtags) && displayContent.hashtags.length > 0) && (
                                  <div className="space-y-2">
                                    <h4 className="font-serif font-semibold text-sm tracking-wide flex items-center gap-2">
                                      <HiOutlineTag className="w-4 h-4 text-muted-foreground" />
                                      Hashtags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {displayContent.hashtags.map((tag, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent value="seo">
                            <ScrollArea className="max-h-[600px] pr-4">
                              <div className="space-y-6">
                                {/* SEO Score */}
                                <div className="flex items-center gap-8">
                                  <SeoScoreRing score={typeof displayContent?.seo_score === 'number' ? displayContent.seo_score : 0} />
                                  <div className="space-y-2 flex-1">
                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Title Tag</Label>
                                      <p className="text-sm font-medium mt-0.5">{displayContent?.title_tag || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Meta Description</Label>
                                      <p className="text-sm mt-0.5 leading-relaxed">{displayContent?.meta_description || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Keywords */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Primary Keywords</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(Array.isArray(displayContent?.primary_keywords) ? displayContent.primary_keywords : []).map((kw, idx) => (
                                        <Badge key={idx} className="bg-primary/15 text-primary border-primary/30 text-xs">{kw}</Badge>
                                      ))}
                                      {!(Array.isArray(displayContent?.primary_keywords) && displayContent.primary_keywords.length > 0) && (
                                        <span className="text-xs text-muted-foreground">None</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Secondary Keywords</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(Array.isArray(displayContent?.secondary_keywords) ? displayContent.secondary_keywords : []).map((kw, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">{kw}</Badge>
                                      ))}
                                      {!(Array.isArray(displayContent?.secondary_keywords) && displayContent.secondary_keywords.length > 0) && (
                                        <span className="text-xs text-muted-foreground">None</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Keyword Density */}
                                {displayContent?.keyword_density_analysis && (
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Keyword Density Analysis</Label>
                                    <div className="bg-secondary/50 rounded-lg p-3">
                                      {renderMarkdown(displayContent.keyword_density_analysis)}
                                    </div>
                                  </div>
                                )}

                                {/* Content Improvements */}
                                {(Array.isArray(displayContent?.content_improvements) && displayContent.content_improvements.length > 0) && (
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Content Improvements</Label>
                                    <ol className="space-y-2">
                                      {displayContent.content_improvements.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                                          <span className="bg-accent/20 text-accent text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}

                                {/* Internal Linking */}
                                {(Array.isArray(displayContent?.internal_linking_suggestions) && displayContent.internal_linking_suggestions.length > 0) && (
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                      <HiOutlineLink className="w-3.5 h-3.5" /> Internal Linking Suggestions
                                    </Label>
                                    <ul className="space-y-1.5">
                                      {displayContent.internal_linking_suggestions.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                                          <HiOutlineChevronRight className="w-3 h-3 mt-1.5 text-primary flex-shrink-0" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Heading Suggestions */}
                                {(Array.isArray(displayContent?.heading_suggestions) && displayContent.heading_suggestions.length > 0) && (
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Heading Suggestions</Label>
                                    <ul className="space-y-1.5">
                                      {displayContent.heading_suggestions.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                                          <HiOutlineChevronRight className="w-3 h-3 mt-1.5 text-accent flex-shrink-0" />
                                          <span className="font-medium">{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <Separator />

                                {/* Overall Assessment */}
                                {displayContent?.overall_assessment && (
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Overall Assessment</Label>
                                    <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
                                      {renderMarkdown(displayContent.overall_assessment)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="shadow-md border-border/30">
                      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                          <HiOutlineDocumentText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-serif text-lg font-semibold tracking-wide mb-2">Ready to Create</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">Fill in the content brief on the left to generate SEO-optimized marketing content powered by AI.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Asset Studio Screen */}
            {activeScreen === 'asset-studio' && (
              <div className="space-y-8">
                {/* Graphic Brief Form */}
                <Card className="shadow-md border-border/30">
                  <CardHeader>
                    <CardTitle className="font-serif tracking-wide flex items-center gap-2">
                      <HiOutlinePhotograph className="w-5 h-5 text-primary" />
                      Graphic Brief
                    </CardTitle>
                    <CardDescription>Describe the visual you need, and our AI designer will create it.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="headline" className="text-sm font-medium">Headline</Label>
                        <Input
                          id="headline"
                          placeholder="e.g., AI Marketing Mastery"
                          value={graphicForm.headline}
                          onChange={(e) => setGraphicForm(prev => ({ ...prev, headline: e.target.value }))}
                          className="bg-card"
                        />
                        {graphicForm.headline && contentResult?.content_title && graphicForm.headline === contentResult.content_title && (
                          <p className="text-xs text-muted-foreground">Auto-populated from last content generation.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Graphic Type</Label>
                        <Select value={graphicForm.graphicType} onValueChange={(val) => setGraphicForm(prev => ({ ...prev, graphicType: val }))}>
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Social Banner">Social Banner</SelectItem>
                            <SelectItem value="Blog Thumbnail">Blog Thumbnail</SelectItem>
                            <SelectItem value="Ad Creative">Ad Creative</SelectItem>
                            <SelectItem value="Infographic">Infographic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Aspect Ratio</Label>
                        <Select value={graphicForm.aspectRatio} onValueChange={(val) => setGraphicForm(prev => ({ ...prev, aspectRatio: val }))}>
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select ratio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9 Landscape">16:9 Landscape</SelectItem>
                            <SelectItem value="1:1 Square">1:1 Square</SelectItem>
                            <SelectItem value="9:16 Portrait">9:16 Portrait</SelectItem>
                            <SelectItem value="4:3 Standard">4:3 Standard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor="styleNotes" className="text-sm font-medium">Additional Style Notes</Label>
                      <Textarea
                        id="styleNotes"
                        placeholder="e.g., Use warm earth tones, include a subtle gradient, professional and modern feel..."
                        value={graphicForm.styleNotes}
                        onChange={(e) => setGraphicForm(prev => ({ ...prev, styleNotes: e.target.value }))}
                        rows={2}
                        className="bg-card resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right">{graphicForm.styleNotes.length} characters</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleGenerateGraphic}
                      disabled={isGeneratingGraphic || !graphicForm.headline}
                      className="bg-primary text-primary-foreground hover:opacity-90 font-medium"
                    >
                      {isGeneratingGraphic ? (
                        <span className="flex items-center gap-2">
                          <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                          Designing your visual...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <HiOutlinePhotograph className="w-4 h-4" />
                          Generate Graphic
                        </span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Error */}
                {graphicError && (
                  <Card className="shadow-md border-destructive/50">
                    <CardContent className="py-4 flex items-center gap-3">
                      <HiOutlineExclamation className="w-5 h-5 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive flex-1">{graphicError}</p>
                      <Button variant="ghost" size="sm" onClick={handleGenerateGraphic}>
                        <HiOutlineRefresh className="w-4 h-4 mr-1" /> Retry
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Loading */}
                {isGeneratingGraphic && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-md border-border/30">
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="w-full aspect-video rounded-lg" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex items-center gap-3 pt-2">
                          <HiOutlineRefresh className="w-5 h-5 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Designing your visual...</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Graphics Grid */}
                {!isGeneratingGraphic && displayGraphics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayGraphics.map((graphic, idx) => (
                      <Card key={idx} className="shadow-md border-border/30 overflow-hidden">
                        <CardContent className="p-0">
                          {/* Image Preview */}
                          {Array.isArray(graphic?.images) && graphic.images.length > 0 && graphic.images[0]?.file_url ? (
                            <div className="relative bg-secondary aspect-video">
                              <img
                                src={graphic.images[0].file_url}
                                alt={graphic?.graphic_title || 'Generated graphic'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-secondary flex items-center justify-center">
                              <HiOutlinePhotograph className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                          )}

                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-serif font-semibold tracking-wide text-sm">{graphic?.graphic_title || 'Untitled'}</h3>
                                {graphic?.graphic_type && <Badge variant="secondary" className="mt-1 text-xs">{graphic.graphic_type}</Badge>}
                              </div>
                              {graphic?.dimensions && (
                                <span className="text-xs text-muted-foreground flex-shrink-0">{graphic.dimensions}</span>
                              )}
                            </div>

                            {graphic?.graphic_description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">{graphic.graphic_description}</p>
                            )}

                            {graphic?.design_notes && (
                              <div className="bg-secondary/50 rounded-md p-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Design Notes</Label>
                                <p className="text-xs mt-1 leading-relaxed">{graphic.design_notes}</p>
                              </div>
                            )}

                            {graphic?.brand_alignment_notes && (
                              <div className="bg-primary/5 rounded-md p-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Brand Alignment</Label>
                                <p className="text-xs mt-1 leading-relaxed">{graphic.brand_alignment_notes}</p>
                              </div>
                            )}

                            {/* Color Palette */}
                            {(Array.isArray(graphic?.color_palette_used) && graphic.color_palette_used.length > 0) && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Color Palette</Label>
                                <div className="flex gap-2 flex-wrap">
                                  {graphic.color_palette_used.map((color, cIdx) => (
                                    <div key={cIdx} className="flex items-center gap-1">
                                      <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: color }} />
                                      <span className="text-xs text-muted-foreground">{color}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Separator />

                            <div className="flex items-center gap-2">
                              {Array.isArray(graphic?.images) && graphic.images.length > 0 && graphic.images[0]?.file_url && (
                                <a
                                  href={graphic.images[0].file_url}
                                  download={graphic.images[0]?.name || 'graphic'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="ghost" size="sm" className="text-xs">
                                    <HiOutlineDownload className="w-4 h-4 mr-1" /> Download
                                  </Button>
                                </a>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  setGraphicForm(prev => ({ ...prev, headline: graphic?.graphic_title || prev.headline }))
                                }}
                                disabled={isGeneratingGraphic}
                              >
                                <HiOutlineRefresh className="w-4 h-4 mr-1" /> Use as Brief
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !isGeneratingGraphic && displayGraphics.length === 0 ? (
                  <Card className="shadow-md border-border/30">
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <HiOutlinePhotograph className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-serif text-lg font-semibold tracking-wide mb-2">Create Your First Graphic</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">Fill in the graphic brief above to generate a professional marketing visual with AI.</p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}

            {/* Campaign History Screen */}
            {activeScreen === 'campaign-history' && (
              <div className="space-y-6">
                {/* Filters */}
                <Card className="shadow-md border-border/30">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative flex-1 w-full">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search campaigns..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-card"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['All', 'Blog Post', 'Social Post', 'Email Copy', 'Ad Copy'].map(type => (
                          <Badge
                            key={type}
                            variant={filterType === type ? 'default' : 'secondary'}
                            className={cn('cursor-pointer transition-all', filterType === type ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/80')}
                            onClick={() => setFilterType(type)}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign List */}
                {filteredCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCampaigns.map(campaign => (
                      <Card key={campaign.id} className="shadow-md border-border/30 hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            {/* Thumbnail */}
                            {campaign.graphicData && Array.isArray(campaign.graphicData.images) && campaign.graphicData.images.length > 0 && campaign.graphicData.images[0]?.file_url ? (
                              <div className="w-20 h-14 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                                <img
                                  src={campaign.graphicData.images[0].file_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-14 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                                <HiOutlineDocumentText className="w-6 h-6 text-muted-foreground/40" />
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif font-semibold text-sm tracking-wide truncate">{campaign.title}</h3>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge variant="secondary" className="text-xs">{campaign.content_type}</Badge>
                                {campaign.contentData?.seo_score !== undefined && typeof campaign.contentData.seo_score === 'number' && (
                                  <Badge variant="outline" className={cn('text-xs', campaign.contentData.seo_score >= 70 ? 'border-green-600 text-green-700' : campaign.contentData.seo_score >= 40 ? 'border-amber-500 text-amber-600' : 'border-red-500 text-red-600')}>
                                    SEO: {campaign.contentData.seo_score}
                                  </Badge>
                                )}
                                <Badge variant={campaign.graphicData ? 'default' : 'outline'} className="text-xs">
                                  {campaign.graphicData ? 'Content + Graphics' : 'Content Only'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{campaign.date}</p>
                            </div>

                            {/* Actions */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCampaign(campaign)}
                              className="flex-shrink-0"
                            >
                              <HiOutlineEye className="w-4 h-4 mr-1" /> View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-md border-border/30">
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <HiOutlineClock className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-serif text-lg font-semibold tracking-wide mb-2">No Campaigns Yet</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {searchQuery || filterType !== 'All'
                          ? 'No campaigns match your current filters. Try adjusting your search.'
                          : 'Create your first content piece from the Dashboard to see it here.'
                        }
                      </p>
                      {!searchQuery && filterType === 'All' && (
                        <Button
                          variant="ghost"
                          className="mt-4 text-sm"
                          onClick={() => setActiveScreen('dashboard')}
                        >
                          <HiOutlineDocumentText className="w-4 h-4 mr-1" /> Go to Dashboard
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Campaign Detail Dialog */}
                <Dialog open={!!selectedCampaign} onOpenChange={(open) => { if (!open) setSelectedCampaign(null) }}>
                  <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="font-serif tracking-wide">{selectedCampaign?.title || 'Campaign Detail'}</DialogTitle>
                      <DialogDescription>
                        <span className="flex items-center gap-2 mt-1">
                          {selectedCampaign?.content_type && <Badge variant="secondary" className="text-xs">{selectedCampaign.content_type}</Badge>}
                          {selectedCampaign?.date && <span className="text-xs">{selectedCampaign.date}</span>}
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
                      <div className="space-y-6">
                        {/* Content Section */}
                        {selectedCampaign?.contentData && (
                          <div className="space-y-4">
                            <h4 className="font-serif font-semibold text-sm tracking-wide uppercase text-muted-foreground">Content</h4>
                            <div className="bg-secondary/30 rounded-lg p-4">
                              {renderMarkdown(selectedCampaign.contentData.content_body || '')}
                            </div>

                            {(Array.isArray(selectedCampaign.contentData.key_takeaways) && selectedCampaign.contentData.key_takeaways.length > 0) && (
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Key Takeaways</Label>
                                <ul className="space-y-1">
                                  {selectedCampaign.contentData.key_takeaways.map((t, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <HiOutlineChevronRight className="w-3 h-3 mt-1.5 text-primary flex-shrink-0" />
                                      {t}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {selectedCampaign.contentData.call_to_action && (
                              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Call to Action</Label>
                                <p className="text-sm mt-1">{selectedCampaign.contentData.call_to_action}</p>
                              </div>
                            )}

                            {(Array.isArray(selectedCampaign.contentData.hashtags) && selectedCampaign.contentData.hashtags.length > 0) && (
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCampaign.contentData.hashtags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            )}

                            {typeof selectedCampaign.contentData.seo_score === 'number' && (
                              <div className="flex items-center gap-4">
                                <SeoScoreRing score={selectedCampaign.contentData.seo_score} />
                                <div className="space-y-1 flex-1">
                                  {selectedCampaign.contentData.title_tag && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Title Tag</Label>
                                      <p className="text-xs font-medium">{selectedCampaign.contentData.title_tag}</p>
                                    </div>
                                  )}
                                  {selectedCampaign.contentData.meta_description && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Meta Description</Label>
                                      <p className="text-xs">{selectedCampaign.contentData.meta_description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedCampaign.contentData.overall_assessment && (
                              <div className="bg-secondary/30 rounded-lg p-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Overall Assessment</Label>
                                <p className="text-sm mt-1 leading-relaxed">{selectedCampaign.contentData.overall_assessment}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <Separator />

                        {/* Graphics Section */}
                        {selectedCampaign?.graphicData ? (
                          <div className="space-y-4">
                            <h4 className="font-serif font-semibold text-sm tracking-wide uppercase text-muted-foreground">Associated Graphic</h4>
                            {Array.isArray(selectedCampaign.graphicData.images) && selectedCampaign.graphicData.images.length > 0 && selectedCampaign.graphicData.images[0]?.file_url && (
                              <div className="rounded-lg overflow-hidden bg-secondary">
                                <img
                                  src={selectedCampaign.graphicData.images[0].file_url}
                                  alt={selectedCampaign.graphicData.graphic_title || ''}
                                  className="w-full object-cover max-h-80"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              {selectedCampaign.graphicData.graphic_type && <Badge variant="secondary" className="text-xs">{selectedCampaign.graphicData.graphic_type}</Badge>}
                              {selectedCampaign.graphicData.dimensions && <span className="text-xs text-muted-foreground">{selectedCampaign.graphicData.dimensions}</span>}
                            </div>
                            {selectedCampaign.graphicData.graphic_description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">{selectedCampaign.graphicData.graphic_description}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">No graphics associated with this campaign.</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                if (selectedCampaign?.contentData?.content_title) {
                                  setGraphicForm(prev => ({ ...prev, headline: selectedCampaign?.contentData?.content_title || '' }))
                                }
                                setSelectedCampaign(null)
                                setActiveScreen('asset-studio')
                              }}
                            >
                              <HiOutlinePhotograph className="w-4 h-4 mr-1" /> Create Graphic
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4">
                      <Button variant="ghost" onClick={() => setSelectedCampaign(null)}>Close</Button>
                      <Button
                        onClick={() => {
                          const text = selectedCampaign?.contentData?.content_body || selectedCampaign?.title || ''
                          handleCopy(text)
                        }}
                        className="bg-primary text-primary-foreground"
                      >
                        {copyFeedback ? <HiOutlineCheck className="w-4 h-4 mr-1" /> : <HiOutlineClipboardCopy className="w-4 h-4 mr-1" />}
                        Copy Content
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
