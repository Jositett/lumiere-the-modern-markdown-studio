import React, { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, FileText, Share2, Database, Trash2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
export default function AdminPage() {
  const adminStats = useEditorStore(s => s.adminStats);
  const setAdminStats = useEditorStore(s => s.setAdminStats);
  const user = useEditorStore(s => s.user);
  const token = useEditorStore(s => s.token);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api<any>('/api/admin/stats');
        setAdminStats(stats);
      } catch (err) {
        toast.error("Failed to load admin dashboard");
      }
    };
    if (user?.role === 'admin') fetchStats();
  }, [user, setAdminStats]);
  if (user?.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <CardTitle className="text-destructive mb-2">Access Denied</CardTitle>
          <CardDescription>You do not have the required permissions to access the administrative dashboard.</CardDescription>
        </Card>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Operator Dashboard</h1>
            <p className="text-muted-foreground">Monitor platform growth, document usage, and system health.</p>
          </div>
          <Button variant="outline" className="gap-2">Export CSV <ArrowUpRight className="w-4 h-4" /></Button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Users', value: adminStats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
            { label: 'Documents', value: adminStats?.totalDocs || 0, icon: FileText, color: 'text-emerald-500' },
            { label: 'Active Shares', value: adminStats?.activeShares || 0, icon: Share2, color: 'text-amber-500' },
            { label: 'Edge Storage', value: `${((adminStats?.storageUsed || 0) / 1024).toFixed(2)} KB`, icon: Database, color: 'text-purple-500' },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="docs">Recent Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card className="p-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-brand-600" />
                  <CardTitle>Platform Growth</CardTitle>
                </div>
              </CardHeader>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adminStats?.dailyStats || []}>
                    <defs>
                      <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="docs" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDocs)" strokeWidth={2} />
                    <Area type="monotone" dataKey="users" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Placeholder rows - would be dynamic in real implementation */}
                  <TableRow>
                    <TableCell className="font-medium">Admin User</TableCell>
                    <TableCell><span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold uppercase">Admin</span></TableCell>
                    <TableCell>May 1, 2025</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}