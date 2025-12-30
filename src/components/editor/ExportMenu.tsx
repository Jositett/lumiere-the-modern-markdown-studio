import React from 'react';
import {
  FileText,
  Code,
  Download,
  ChevronDown,
  Printer,
  DownloadCloud
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
import { useState, useEffect } from 'react';
export function ExportMenu() {
  const content = useEditorStore(s => s.content);
  const title = useEditorStore(s => s.title);
  const activeDocumentId = useEditorStore(s => s.activeDocumentId);
  const [html2pdfReady, setHtml2pdfReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || (window as any).html2pdf) {
      setHtml2pdfReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      setHtml2pdfReady(true);
    };
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
    body { 
      box-sizing: border-box; 
      min-width: 200px; 
      max-width: 980px; 
      margin: 0 auto; 
      padding: 45px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }
    @media (max-width: 767px) { 
      body { padding: 15px; } 
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
    }
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
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const exportPDF = async () => {
    if (!html2pdfReady) {
      toast.error('PDF engine loading...');
      return;
    }
    const html2pdf = (window as any).html2pdf;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Lumiere Studio</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }
    @media (max-width: 767px) {
      body { padding: 15px; }
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
    }
  </style>
</head>
<body class="markdown-body">
  <h1>${title}</h1>
  <hr />
  ${content}
</body>
</html>`;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-99999px';
    tempDiv.style.top = '0';
    document.body.appendChild(tempDiv);
    try {
      await html2pdf()
        .set({
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `${title || 'document'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        })
        .from(tempDiv)
        .save();
      toast.success('PDF exported');
    } catch (e) {
      toast.error('PDF export failed');
    } finally {
      document.body.removeChild(tempDiv);
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
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>The Press Export Engine</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={downloadMarkdown} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span>Download Markdown</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportHtml} className="gap-2 cursor-pointer">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span>Export as Styled HTML</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} className="gap-2 cursor-pointer">
          <Printer className="w-4 h-4 text-muted-foreground" />
          <span>Print to PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer" disabled={!html2pdfReady || !activeDocumentId}>
          <DownloadCloud className="w-4 h-4 text-muted-foreground" />
          <span>Export PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}