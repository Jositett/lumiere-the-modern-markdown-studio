import React from 'react';
import {
  FileText,
  Code,
  Download,
  ChevronDown,
  Printer
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
export function ExportMenu() {
  const content = useEditorStore(s => s.content);
  const title = useEditorStore(s => s.title);
  const activeDocumentId = useEditorStore(s => s.activeDocumentId);
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}