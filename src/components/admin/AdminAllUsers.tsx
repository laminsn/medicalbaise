import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { sanitizePostgrestValue } from '@/lib/sanitize';
import { Search, Loader2, Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, es as esLocale, ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/currency';

interface UserWithLogin {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  user_type: string;
  status: string | null;
  handle: string | null;
  created_at: string | null;
  city: string | null;
  state: string | null;
  credits_balance: number | null;
}

export function AdminAllUsers() {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const dateLocale = isPt ? ptBR : isEs ? esLocale : enUS;
  const [users, setUsers] = useState<UserWithLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 25;

  const fetchUsers = async (search?: string, pageNum = 0) => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (search && search.trim()) {
        const safe = sanitizePostgrestValue(search);
        query = query.or(
          `email.ilike.%${safe}%,first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,handle.ilike.%${safe}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
      setTotalCount(count || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    setPage(0);
    fetchUsers(searchQuery, 0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers(searchQuery, newPage);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const getUserTypeLabel = (userType: string) => {
    if (isPt) {
      if (userType === 'provider') return 'profissional';
      if (userType === 'customer') return 'cliente';
      if (userType === 'admin') return 'administrador';
      return userType;
    }
    if (isEs) {
      if (userType === 'provider') return 'profesional';
      if (userType === 'customer') return 'cliente';
      if (userType === 'admin') return 'administrador';
    }
    return userType;
  };

  const getStatusLabel = (status: string | null) => {
    const current = status || 'Active';
    if (isPt) {
      if (current === 'Active' || current === 'Available') return 'Ativo';
      if (current === 'Suspended') return 'Suspenso';
      if (current === 'Busy') return 'Ocupado';
      if (current === 'On Vacation') return 'De férias';
      if (current === 'Open to Work') return 'Disponível para trabalho';
      if (current === 'Hiring') return 'Contratando';
      if (current === 'Learning') return 'Aprendendo';
      if (current === 'Building') return 'Construindo';
      if (current === 'Invested!') return 'Investido!';
      return current;
    }
    if (isEs) {
      if (current === 'Active' || current === 'Available') return 'Activo';
      if (current === 'Suspended') return 'Suspendido';
      if (current === 'Busy') return 'Ocupado';
      if (current === 'On Vacation') return 'De vacaciones';
      if (current === 'Open to Work') return 'Abierto a trabajo';
      if (current === 'Hiring') return 'Contratando';
      if (current === 'Learning') return 'Aprendiendo';
      if (current === 'Building') return 'Construyendo';
      if (current === 'Invested!') return '¡Invertido!';
    }
    return current;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder={isPt ? 'Buscar por nome, email ou @usuário...' : isEs ? 'Buscar por nombre, email o @usuario...' : 'Search by name, email, or handle...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {isPt ? 'Buscar' : isEs ? 'Buscar' : 'Search'}
            </Button>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setPage(0); fetchUsers('', 0); }} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isPt ? 'Todos os usuários' : isEs ? 'Todos los usuarios' : 'All Users'} ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isPt ? 'Usuário' : isEs ? 'Usuario' : 'User'}</TableHead>
                      <TableHead>{isPt ? 'E-mail' : isEs ? 'Correo' : 'Email'}</TableHead>
                      <TableHead>{isPt ? 'Tipo' : isEs ? 'Tipo' : 'Type'}</TableHead>
                      <TableHead>{isPt ? 'Localização' : isEs ? 'Ubicación' : 'Location'}</TableHead>
                      <TableHead>{isPt ? 'Créditos' : isEs ? 'Créditos' : 'Credits'}</TableHead>
                      <TableHead>{isPt ? 'Status' : isEs ? 'Estado' : 'Status'}</TableHead>
                      <TableHead>{isPt ? 'Cadastro' : isEs ? 'Registro' : 'Joined'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {isPt ? 'Nenhum usuário encontrado' : isEs ? 'No se encontraron usuarios' : 'No users found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {user.first_name || ''} {user.last_name || ''}
                              </p>
                              {user.handle && (
                                <p className="text-xs text-primary">@{user.handle}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.email || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={user.user_type === 'provider' ? 'default' : 'secondary'} className="text-xs">
                              {getUserTypeLabel(user.user_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {[user.city, user.state].filter(Boolean).join(', ') || '—'}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatPrice(user.credits_balance || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.status === 'Suspended' ? 'destructive' :
                                user.status === 'Available' ? 'default' : 'outline'
                              }
                              className="text-xs"
                            >
                              {getStatusLabel(user.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy', { locale: dateLocale }) : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {isPt ? 'Mostrando' : isEs ? 'Mostrando' : 'Showing'} {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} {isPt ? 'de' : isEs ? 'de' : 'of'} {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {isPt ? 'Página' : isEs ? 'Página' : 'Page'} {page + 1} {isPt ? 'de' : isEs ? 'de' : 'of'} {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
