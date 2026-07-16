import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '@/services/users'
import { getMentors, updateMentor } from '@/services/bd-mentor'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Plus, Trash2, Pencil, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Navigate } from 'react-router-dom'

export default function Users() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('usuarios')

  const [users, setUsers] = useState<any[]>([])
  const [mentors, setMentors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    perfil_acess: 'Vendedor',
  })

  const loadData = async () => {
    try {
      const [uData, mData] = await Promise.all([getUsers(), getMentors()])
      setUsers(uData)
      setMentors(mData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('users', () => loadData())
  useRealtime('bd_mentor', () => loadData())

  const filteredUsers = users.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()),
  )

  const filteredMentors = mentors.filter(
    (m) =>
      (m.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleOpenModal = (userToEdit: any = null) => {
    setEditingUser(userToEdit)
    if (userToEdit) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '',
        passwordConfirm: '',
        perfil_acess: userToEdit.perfil_acess || 'Vendedor',
      })
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        passwordConfirm: '',
        perfil_acess: 'Vendedor',
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingUser) {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          perfil_acess: formData.perfil_acess,
        }
        if (formData.password) {
          payload.password = formData.password
          payload.passwordConfirm = formData.passwordConfirm
        }
        await updateUser(editingUser.id, payload)
        toast.success('Usuário atualizado com sucesso')
      } else {
        await createUser(formData)
        toast.success('Usuário criado com sucesso')
      }
      setIsModalOpen(false)
    } catch (e) {
      const errors = extractFieldErrors(e)
      toast.error(Object.values(errors)[0] || 'Erro ao salvar usuário')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(id)
        toast.success('Usuário excluído com sucesso')
      } catch (e: any) {
        if (e?.status === 400) {
          toast.error('Não é possível excluir pois existem registros vinculados.')
        } else {
          toast.error(getErrorMessage(e))
        }
      }
    }
  }

  const handleToggleMentorStatus = async (mentor: any, isAtivo: boolean) => {
    try {
      await updateMentor(mentor.id, { ativo: isAtivo })
      toast.success('Status do mentor atualizado')
    } catch (e) {
      toast.error('Erro ao atualizar status')
    }
  }

  if (user?.perfil_acess !== 'Gestor' && user?.perfil_acess !== 'Suporte') {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Usuários e Mentores"
        description="Gerencie os acessos, perfis da equipe e o banco de mentores."
      />

      <div className="px-8 pb-8 flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="usuarios">Gestão de Usuários</TabsTrigger>
              <TabsTrigger value="mentores">Gestão de Mentores</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  className="pl-9 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {activeTab === 'usuarios' && (
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="usuarios" className="flex-1 mt-0">
            <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden shadow-sm h-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-zinc-900">{u.name || '-'}</TableCell>
                      <TableCell className="text-zinc-500">{u.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                          {u.perfil_acess || 'Nenhum'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-violet-600"
                            onClick={() => handleOpenModal(u)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="mentores" className="flex-1 mt-0">
            <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden shadow-sm h-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                    <TableHead>Nome do Mentor(a)</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-[100px] text-center">Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMentors.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-zinc-900">{m.nome || '-'}</TableCell>
                      <TableCell className="text-zinc-500">{m.email}</TableCell>
                      <TableCell className="text-zinc-500">{m.phone || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={m.ativo}
                          onCheckedChange={(c) => handleToggleMentorStatus(m, c)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMentors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                        Nenhum mentor encontrado. Crie um usuário com perfil "Mentor(a)" para que
                        ele apareça aqui.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select
                value={formData.perfil_acess}
                onValueChange={(val) => setFormData({ ...formData, perfil_acess: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gestor">Gestor</SelectItem>
                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                  <SelectItem value="Suporte">Suporte</SelectItem>
                  <SelectItem value="Mentor(a)">Mentor(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Senha {editingUser && '(Deixe em branco para manter)'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                    passwordConfirm: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
