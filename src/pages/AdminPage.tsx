import React, { useEffect, useState, useMemo } from 'react';
import { useEditorStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, FileText, Share2, Database, ShieldAlert, ShieldCheck, Download, Activity, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { User, SystemLog } from '@shared/types';
export default function AdminPage() {
  const adminStats = useEditorStore(s => s.adminStats);
  const setAdminStats = useEditorStore(s => s.setAdminStats);
  const user = useEditorStore(s => s.user);
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [stats, users, sysLogs] = await Promise.all([
        api<any>('/api/admin/stats'),
        api<{ items: User[] }>('/api/admin/users'),
        api<SystemLog[]>('/api/admin/logs')
      ]);
      setAdminStats(stats);
      setPlatformUsers(users.items || []);
      setLogs(sysLogs || []);
    } catch (err) {
      toast.error("Security authorization failed or platform error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user?.role === 'admin') fetchAdminData();
  }, [user]);
  const filteredUsers = useMemo(() => 
    platformUsers.filter(u => 
      u.email.toLowerCase().includes(search.toLowerCase()) || 
      u.name.toLowerCase().includes(search.toLowerCase())
    ), [platformUsers, search]);
  const toggleBan = async (targetUser: User) => {
    if (!confirm(`Are you sure you want to ${targetUser.isBanned ? 'unban' : 'ban'} ${targetUser.email}?`)) return;
    try {
      const res = await api<{ isBanned: boolean }>(`/api/admin/users/${targetUser.id}/ban`, { method: 'POST' });
      setPlatformUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isBanned: res.isBanned } : u));
      toast.success(`User ${res.isBanned ? 'banned' : 'restored'}`);
    } catch (e) {
      toast.error("Action failed");
    }
  };
  const exportCSV = () => {
    const headers = "ID,Name,Email,Role,Status,Joined\n";
    const rows = platformUsers.map(u => `${u.id},${u.name},${u.email},${u.role},${u.isBanned ? 'Banned' : 'Active'},${new Date(u.createdAt || 0).toISOString()}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumiere-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Export started");
  };
  if (user?.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center p-8 bg-muted/10">
        <Card className="max-w-md text-center p-12 rounded-3xl border-2">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-6" />
          <CardTitle className="text-2xl font-bold mb-4">Operator Clearance Required</CardTitle>
          <CardDescription>Only authorized administrators can access the governance layer.</CardDescription>
        </Card>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-widest border border-brand-100">
            <Activity className="w-3 h-3" /> System Live
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Operator Governance</h1>
          <p className="text-muted-foreground max-w-xl">Monitor platform health, enforce security policies, and manage global writing infrastructure.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2 h-12 rounded-xl border-2 shadow-sm hover:bg-brand-50 hover:text-brand-700 transition-all">
          <Download className="w-4 h-4" /> Export CSV Report
        </Button>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Authors', value: adminStats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
          { label: 'Active Drafts', value: adminStats?.totalDocs || 0, icon: FileText, color: 'text-emerald-500' },
          { label: 'Public Shares', value: adminStats?.activeShares || 0, icon: Share2, color: 'text-amber-500' },
          { label: 'Safety Index', value: `${(adminStats?.bannedUsers || 0)} Bans`, icon: ShieldAlert, color: 'text-rose-500' },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-md bg-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="users" className="space-y-8">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto">
          <TabsTrigger value="users" className="rounded-xl px-8 py-2.5">User Directory</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-8 py-2.5">Security Logs</TabsTrigger>
          <TabsTrigger value="charts" className="rounded-xl px-8 py-2.5">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card rounded-xl border-2 focus-visible:ring-brand-500"
            />
          </div>
          <Card className="rounded-2xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className={cn(u.isBanned && "opacity-60 grayscale bg-muted/20")}>
                    <TableCell className="font-bold">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{u.email}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        u.role === 'admin' ? "bg-brand-100 text-brand-700" : "bg-muted text-muted-foreground"
                      )}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                        u.subscriptionStatus === 'pro' ? "border-brand-600 text-brand-600" : "border-muted-foreground text-muted-foreground"
                      )}>
                        {u.subscriptionStatus || 'free'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleBan(u)}
                        className={cn(u.isBanned ? "text-emerald-600 hover:bg-emerald-50" : "text-destructive hover:bg-destructive/5")}
                      >
                        {u.isBanned ? <ShieldCheck className="w-4 h-4 mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                        {u.isBanned ? 'Restore' : 'Ban'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card className="rounded-2xl border shadow-sm p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Author ID</TableHead>
                  <TableHead>Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell className="font-medium">{log.event}</TableCell>
                    <TableCell className="font-mono text-[10px]">{log.userId || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter",
                        log.level === 'security' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      )}>{log.level}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="charts">
          <Card className="p-8 rounded-2xl border shadow-sm">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={adminStats?.dailyStats || []}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="docs" stroke="#3b82f6" fill="url(#colorUsage)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}