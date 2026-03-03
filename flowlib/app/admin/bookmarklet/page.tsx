'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Bookmark, ExternalLink, Zap } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rungtm.com'

function buildBookmarklet(apiKey: string): string {
  // Minified bookmarklet JS — selects text or page content, posts to /api/ingest
  const code = `(function(){
var sel=window.getSelection&&window.getSelection().toString().trim();
var content=sel||document.body.innerText.slice(0,8000);
if(!content||content.length<20){alert('RunGTM: Select some text first (or the page will be used).');return;}
var key='${apiKey}';
var url='${APP_URL}/api/ingest';
fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key},body:JSON.stringify({content:content,source_url:location.href,platform:location.hostname.includes('twitter.com')||location.hostname.includes('x.com')?'twitter':location.hostname.includes('linkedin.com')?'linkedin':location.hostname.includes('reddit.com')?'reddit':'manual'})})
.then(function(r){return r.json().then(function(j){return{ok:r.ok,status:r.status,j:j}})})
.then(function(res){
if(res.status===409){alert('RunGTM: Already seen — idea #'+res.j.idea_id);}
else if(res.status===422){alert('RunGTM: Not a GTM flow (confidence: '+(res.j.confidence||0)+')\\n'+res.j.title);}
else if(!res.ok){alert('RunGTM error: '+JSON.stringify(res.j));}
else{alert('RunGTM: Saved!\\n"'+(res.j.extracted&&res.j.extracted.title||'untitled')+'"\\nConfidence: '+Math.round(((res.j.extracted&&res.j.extracted.confidence)||0)*100)+'%');}
})
.catch(function(e){alert('RunGTM fetch error: '+e.message);});
})();`

  return `javascript:${encodeURIComponent(code)}`
}

export default function BookmarkletPage() {
  const [apiKey,  setApiKey]  = useState('')
  const [copied,  setCopied]  = useState(false)
  const [testing, setTesting] = useState(false)
  const [testUrl, setTestUrl] = useState('')
  const [testResult, setTestResult] = useState<object | null>(null)

  const bookmarkletHref = apiKey.trim() ? buildBookmarklet(apiKey.trim()) : '#'

  function copy() {
    if (!apiKey.trim()) return
    navigator.clipboard.writeText(bookmarkletHref)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function testIngest() {
    if (!apiKey.trim() || !testUrl.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/ingest', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey.trim() },
        body:    JSON.stringify({ content: `Test from bookmarklet page: ${testUrl}`, source_url: testUrl }),
      })
      setTestResult(await res.json())
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bookmark className="h-6 w-6" /> Bookmarklet Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            One-click scraping from any webpage — Twitter, LinkedIn, Reddit, or anywhere.
          </p>
        </div>
        <a href="/admin"><Button variant="outline" size="sm">← Admin</Button></a>
      </div>

      {/* Step 1 — API key */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">1</span>
          Enter your Ingest API Key
        </h2>
        <p className="text-sm text-muted-foreground">
          Found in your environment variables as <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">INGEST_API_KEY</code>.
        </p>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Your INGEST_API_KEY value"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      {/* Step 2 — Drag to bookmarks */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">2</span>
          Drag to your bookmarks bar
        </h2>
        <p className="text-sm text-muted-foreground">
          Drag the button below to your browser&apos;s bookmarks bar. Or copy the link and add it manually as a bookmark.
        </p>

        <div className="flex items-center gap-3">
          {/* The actual draggable bookmarklet link */}
          <a
            href={bookmarkletHref}
            onClick={e => { if (!apiKey.trim()) { e.preventDefault(); return } }}
            draggable
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed font-medium text-sm transition-colors select-none ${
              apiKey.trim()
                ? 'border-primary text-primary hover:bg-primary/5 cursor-grab active:cursor-grabbing'
                : 'border-border text-muted-foreground cursor-not-allowed opacity-50'
            }`}
            title="Drag me to your bookmarks bar"
          >
            <Zap className="h-4 w-4" />
            RunGTM: Save Flow
          </a>

          <Button variant="outline" size="sm" onClick={copy} disabled={!apiKey.trim()} className="gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
        </div>

        {/* How it works */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium">How to use:</p>
          <ol className="space-y-1 text-muted-foreground list-none">
            <li>1. Navigate to a tweet, LinkedIn post, or Reddit thread</li>
            <li>2. <strong>Optional:</strong> select specific text to submit just that portion</li>
            <li>3. Click the <em>RunGTM: Save Flow</em> bookmark</li>
            <li>4. An alert confirms whether it was saved, skipped (dup), or not a GTM flow</li>
            <li>5. Saved ideas appear in <a href="/admin" className="text-primary hover:underline">Admin review queue</a></li>
          </ol>
        </div>
      </div>

      {/* Step 3 — Test it */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">3</span>
          Test the endpoint
        </h2>
        <p className="text-sm text-muted-foreground">
          Paste any URL + paste some content to test the ingest API directly.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Source URL</Label>
            <Input
              placeholder="https://twitter.com/..."
              value={testUrl}
              onChange={e => setTestUrl(e.target.value)}
            />
          </div>
          <Button onClick={testIngest} disabled={!apiKey.trim() || !testUrl.trim() || testing} size="sm" className="gap-1.5">
            <ExternalLink className="h-4 w-4" />
            {testing ? 'Testing…' : 'Send test request'}
          </Button>
        </div>

        {testResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Response</p>
              {'ok' in (testResult as Record<string, unknown>) && !!(testResult as Record<string, unknown>).ok && (
                <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-400/30 text-xs">Success</Badge>
              )}
              {'error' in (testResult as Record<string, unknown>) && (
                <Badge variant="destructive" className="text-xs">Error</Badge>
              )}
            </div>
            <Textarea
              readOnly
              rows={8}
              value={JSON.stringify(testResult, null, 2)}
              className="font-mono text-xs"
            />
          </div>
        )}
      </div>

      {/* API reference */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-3">
        <h2 className="font-semibold">API Reference — POST /api/ingest</h2>
        <p className="text-sm text-muted-foreground">Use this endpoint from Zapier, Make.com, CLI scripts, or your browser extension.</p>
        <Textarea
          readOnly
          rows={14}
          className="font-mono text-xs"
          value={`# Header auth
x-api-key: YOUR_INGEST_API_KEY

# Request body (JSON)
{
  "content":    "Raw post text (required, min 20 chars)",
  "source_url": "https://...",           // optional
  "platform":   "twitter|linkedin|reddit|manual",  // default: manual
  "author":     "Name for attribution"  // optional
}

# 201 — saved as pending idea
# 409 — URL already seen  → { idea_id, status }
# 422 — not a GTM flow    → { confidence, title }
# 401 — bad API key`}
        />
      </div>
    </div>
  )
}
