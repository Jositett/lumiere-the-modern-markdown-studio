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
      <ResizableHandle withHandle className="bg-border/50 hover:bg-brand-500 transition-colors w-1.5" />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <div className="h-full w-full">{right}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}