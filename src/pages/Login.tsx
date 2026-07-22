import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import logoUrl from '@/assets/logopfsfundo-562b4.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Falha no login',
        description: getErrorMessage(error),
      })
    } else {
      navigate('/connection-setup')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-blue-600/20 mb-4 overflow-hidden p-1">
            <img
              src={logoUrl}
              alt="CRM Perícia Foco Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h1>
          <p className="text-slate-500">Faça login para acessar o CRM Perícia Foco</p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>Insira seu e-mail e senha abaixo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-visible:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus-visible:ring-blue-600"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Entrar
              </Button>
              <div className="text-center text-sm text-slate-500">
                Não possui uma conta?{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Cadastrar-se
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
