import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Edit, Loader2, Save, User } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  user_type: string;
  credits_balance: number | null;
  status: string | null;
  handle: string | null;
  referral_code: string | null;
  created_at: string | null;
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    // Search by email, name, or handle
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,handle.ilike.%${searchQuery}%`)
      .limit(20);

    if (error) {
      toast.error('Error searching users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const loadAllUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Error loading users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  const openEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      state: user.state,
      status: user.status,
      handle: user.handle,
      credits_balance: user.credits_balance,
      user_type: user.user_type,
    });
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: editData.first_name || null,
        last_name: editData.last_name || null,
        phone: editData.phone || null,
        city: editData.city || null,
        state: editData.state || null,
        status: editData.status || null,
        handle: editData.handle || null,
        credits_balance: editData.credits_balance ?? 0,
      })
      .eq('user_id', selectedUser.user_id);

    if (error) {
      toast.error('Error saving: ' + error.message);
    } else {
      toast.success('User updated successfully');
      setSelectedUser(null);
      // Refresh list
      if (searchQuery) {
        searchUsers();
      } else {
        loadAllUsers();
      }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, or handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={loadAllUsers} disabled={loading}>
              All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No users found</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {user.user_type}
                        </Badge>
                        {user.handle && (
                          <span className="text-xs text-primary">@{user.handle}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          R${user.credits_balance || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Email: <strong>{selectedUser.email}</strong>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>First Name</Label>
                  <Input
                    value={editData.first_name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Last Name</Label>
                  <Input
                    value={editData.last_name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Handle</Label>
                <Input
                  value={editData.handle || ''}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    handle: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={editData.phone || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input
                    value={editData.city || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>State</Label>
                  <Input
                    value={editData.state || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Credits Balance (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={editData.credits_balance ?? 0}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    credits_balance: parseInt(e.target.value) || 0,
                  }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={editData.status || ''}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="On Vacation">On Vacation</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
