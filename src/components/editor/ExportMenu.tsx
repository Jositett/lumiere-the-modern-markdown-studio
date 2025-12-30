import React, { useState, useEffect } from 'react';
import {
  FileText,
  Code,
  Download,
  ChevronDown,
  Printer,
  DownloadCloud,
  Star,
  Layers
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useEditorStore } from '@/lib/store';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
export function ExportMenu() {
  const content = useEditorStore(s => s.content);
  const title = useEditorStore(s => s.title);
  const activeDocumentId = useEditorStore(s => s.activeDocumentId);
  const isGuest = useEditorStore(s => s.isGuest);
  const [preserveTheme, setPreserveTheme] = useState(false);
  const [html2pdfReady, setHtml2pdfReady] = useState(false);
  useEffect(() => {
    const SCRIPT_ID = 'lumiere-html2pdf-script';
    let isMounted = true;
    if (document.getElementById(SCRIPT_ID)) {
      setHtml2pdfReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    script.onload = () => {
      if (isMounted) setHtml2pdfReady(true);
    };
    document.head.appendChild(script);
    return () => {
      isMounted = false;
    };
  }, []);
  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'untitled'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown downloaded");
  };
  const exportHtml = () => {
    const hlThemeLink = document.getElementById('hljs-theme') as HTMLLinkElement | null;
    const hlStyle = hlThemeLink ? `<link rel="stylesheet" href="${hlThemeLink.href}">` : '';
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} | Lumiere</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
  ${hlStyle}
</head>
<body class="markdown-body" style="padding: 50px; max-width: 900px; margin: 0 auto;">
  <h1>${title}</h1>
  <hr />
  ${content}
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'untitled'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handlePrint = () => {
    toast.info("Opening system print dialog...");
    setTimeout(() => window.print(), 300);
  };
  const exportPDF = async () => {
    if (isGuest) {
      toast.error('Native PDF Export is a Professional feature.');
      return;
    }
    if (!html2pdfReady) {
      toast.error('PDF engine not ready');
      return;
    }
    const previewEl = document.getElementById('markdown-preview');
    if (!previewEl) return;
    const opt = {
      margin: 1,
      filename: `${title || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    const html2pdf = (window as any).html2pdf;
    try {
      await html2pdf().set(opt).from(previewEl).save();
      toast.success('PDF exported');
    } catch (e) {
      toast.error('PDF export failed');
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={!activeDocumentId}>
          <Download className="w-4 h-4" />
          <span className="hidden md:inline">Export</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">The Press Engine</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase">Preserve Theme</span>
          </div>
          <Switch checked={preserveTheme} onCheckedChange={setPreserveTheme} className="scale-75" />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={downloadMarkdown} className="gap-3 cursor-pointer py-2.5">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-col"><span className="font-medium">Markdown</span><span className="text-[10px] text-muted-foreground">Raw source (.md)</span></div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportHtml} className="gap-3 cursor-pointer py-2.5">
          <Code className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-col"><span className="font-medium">Styled HTML</span><span className="text-[10px] text-muted-foreground">Studio aesthetic</span></div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} className="gap-3 cursor-pointer py-2.5">
          <Printer className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-col"><span className="font-medium">Print to PDF</span><span className="text-[10px] text-muted-foreground">System print</span></div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} disabled={isGuest} className={cn("gap-3 cursor-pointer py-2.5 flex items-center justify-between", isGuest && "opacity-50")}>
          <div className="flex items-center gap-3">
            <DownloadCloud className="w-4 h-4 text-brand-600" />
            <div className="flex flex-col"><span className="font-medium">Native PDF</span><span className="text-[10px] text-muted-foreground">Pro precision</span></div>
          </div>
          {isGuest && <Badge className="text-[8px] bg-brand-100 text-brand-700"><Star className="w-2 h-2 mr-1" /> PRO</Badge>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}