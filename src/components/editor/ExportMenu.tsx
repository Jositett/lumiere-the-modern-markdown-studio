import React, { useState, useEffect } from 'react';
import {
  FileText,
  Code,
  Download,
  ChevronDown,
  Printer,
  DownloadCloud,
  Star
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
import { useEditorStore } from '@/lib/store';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
export function ExportMenu() {
  const content = useEditorStore(s => s.content);
  const title = useEditorStore(s => s.title);
  const activeDocumentId = useEditorStore(s => s.activeDocumentId);
  const isGuest = useEditorStore(s => s.isGuest);
  const [html2pdfReady, setHtml2pdfReady] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).html2pdf) {
      setHtml2pdfReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => setHtml2pdfReady(true);
    document.head.appendChild(script);
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
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Lumiere Studio</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
  <style>
    body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    @media (max-width: 767px) { body { padding: 15px; } }
    .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; }
  </style>
</head>
<body class="markdown-body">
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
    toast.success("Styled HTML exported");
  };
  const handlePrint = () => {
    toast.info("Preparing document for print...");
    setTimeout(() => window.print(), 500);
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
    const previewEl = document.getElementById('markdown-preview') as HTMLElement | null;
    if (!previewEl) {
      toast.error('Preview not visible - switch to preview pane');
      return;
    }
    const clone = previewEl.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, {
      position: 'absolute',
      left: '-10000px',
      top: '-10000px',
      width: '21cm',
      height: 'auto',
      backgroundColor: 'white',
      zIndex: '-1',
      boxSizing: 'border-box'
    });
    document.body.appendChild(clone);
    const html2pdf = (window as any).html2pdf;
    try {
      await html2pdf()
        .set({
          margin: [1, 1, 1, 1],
          filename: `${title || 'document'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
        })
        .from(clone)
        .save();
      toast.success('PDF exported');
    } catch (e) {
      toast.error('PDF export failed');
    } finally {
      document.body.removeChild(clone);
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
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">The Press Engine</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={downloadMarkdown} className="gap-3 cursor-pointer py-2.5 rounded-lg">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">Download Markdown</span>
            <span className="text-[10px] text-muted-foreground">Raw source file (.md)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportHtml} className="gap-3 cursor-pointer py-2.5 rounded-lg">
          <Code className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">Export Styled HTML</span>
            <span className="text-[10px] text-muted-foreground">Standalone web page</span>
          </div>
        </DropdownMenuItem>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem onClick={handlePrint} className="gap-3 cursor-pointer py-2.5 rounded-lg">
                <Printer className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">Print to PDF</span>
                  <span className="text-[10px] text-muted-foreground">Uses browser print dialog</span>
                </div>
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="left">Recommended for quick saving</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuItem
          onClick={exportPDF}
          className={cn("gap-3 cursor-pointer py-2.5 rounded-lg flex items-center justify-between", isGuest && "opacity-70")}
        >
          <div className="flex items-center gap-3">
            <DownloadCloud className="w-4 h-4 text-brand-600" />
            <div className="flex flex-col">
              <span className="font-medium">Export Native PDF</span>
              <span className="text-[10px] text-muted-foreground">Pixel-perfect formatting</span>
            </div>
          </div>
          {isGuest && <Badge variant="secondary" className="text-[9px] bg-brand-50 text-brand-700 h-4 px-1.5"><Star className="w-2 h-2 mr-1 fill-current" /> PRO</Badge>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}