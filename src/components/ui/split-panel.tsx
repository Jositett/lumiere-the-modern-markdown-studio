import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
interface SplitPanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  defaultLayout?: number[];
}
export function SplitPanel({ left, right, className, defaultLayout = [50, 50] }: SplitPanelProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("min-h-[200px] w-full rounded-lg border bg-background", className)}
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
        <div className="h-full w-full">{left}</div>
      </ResizablePanel>
      <ResizableHandle withHandle className="w-2 bg-border/20 hover:bg-brand-400/40 data-[state=resizing]:bg-brand-500/60 shadow-md transition-all duration-200 cursor-col-resize flex items-center justify-center relative z-20 data-[state=open]:bg-muted/30 hover:shadow-lg hover:scale-110 hover:z-30 data-[state=resizing]:transition-none data-[state=resizing]:shadow-none data-[state=resizing]:scale-100 hover:data-[state=resizing]:scale-100 data-[state=resizing]:hover:scale-100" />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <div className="h-full w-full">{right}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}