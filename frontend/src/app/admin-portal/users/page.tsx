'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Users,
  UserCheck,
  UserX,
  Building2,
  Mail,
  Phone,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateUserDialog } from '@/components/admin/users/CreateUserDialog';

import {
  getAdminUsers,
  blockUser,
  unblockUser,
  type AdminUser,
} from '@/lib/api/admin-users';

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
  });

  // Block/unblock dialog
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<'block' | 'unblock'>('block');
  const [isProcessing, setIsProcessing] = useState(false);

  // Create user dialog
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const blocked = filterParam === 'blocked' ? true : filterParam === 'active' ? false : undefined;
      const result = await getAdminUsers({
        userType: 'reseller',
        blocked,
      });

      setUsers(result.users);

      // Calculate stats
      const active = result.users.filter((u) => !u.blocked).length;
      const blockedCount = result.users.filter((u) => u.blocked).length;

      setStats({
        total: result.users.length,
        active,
        blocked: blockedCount,
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [filterParam]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      if (actionType === 'block') {
        await blockUser(selectedUser.id);
        toast.success(`${selectedUser.email} has been blocked`);
      } else {
        await unblockUser(selectedUser.id);
        toast.success(`${selectedUser.email} has been unblocked`);
      }
      setActionDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(`Failed to ${actionType} user`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (user: AdminUser, action: 'block' | 'unblock') => {
    setSelectedUser(user);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: 'email',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original;
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
        const logoUrl = user.reseller_logo?.formats?.thumbnail?.url || user.reseller_logo?.url;
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img
                  src={`${strapiUrl}${logoUrl}`}
                  alt={user.company || user.email}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium ">
                {fullName || user.username}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => {
        const company = row.original.company;
        return company ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{company}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="space-y-1">
            {user.phone && (
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.businessLicense && (
              <div className="text-xs text-muted-foreground">
                License: {user.businessLicense}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-sm">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const user = row.original;
        if (user.blocked) {
          return <StatusBadge status="blocked" variant="user-account" showDot={false} />;
        }
        if (!user.confirmed) {
          return <StatusBadge status="pending" variant="user-account" showDot={false} />;
        }
        return <StatusBadge status="active" variant="user-account" showDot={false} />;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin-portal/users/${user.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`mailto:${user.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.blocked ? (
                <DropdownMenuItem
                  onClick={() => openActionDialog(user, 'unblock')}
                  className="text-green-600 focus:text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Unblock User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => openActionDialog(user, 'block')}
                  className="text-red-600 focus:text-red-600"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Block User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold ">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage reseller accounts and access
          </p>
        </div>
        <Button onClick={() => setCreateUserDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={`cursor-pointer transition-colors ${!filterParam ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`}
          onClick={() => router.push('/admin-portal/users')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Resellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filterParam === 'active' ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`}
          onClick={() => router.push('/admin-portal/users?filter=active')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filterParam === 'blocked' ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`}
          onClick={() => router.push('/admin-portal/users?filter=blocked')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.blocked}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={users}
            searchKey="email"
            searchPlaceholder="Search by email or company..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Block/Unblock Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'block' ? 'Block User' : 'Unblock User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'block' ? (
                <>
                  Are you sure you want to block <strong>{selectedUser?.email}</strong>?
                  They will no longer be able to log in or place orders.
                </>
              ) : (
                <>
                  Are you sure you want to unblock <strong>{selectedUser?.email}</strong>?
                  They will be able to log in and place orders again.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'block' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : actionType === 'block' ? 'Block User' : 'Unblock User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserDialogOpen}
        onClose={() => setCreateUserDialogOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
