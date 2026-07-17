import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Check } from 'lucide-react'
import logoUrl from '@/assets/logoescritopericiafoco-42506.png'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  area_grad: z.string().min(1, 'Área de graduação é obrigatória'),
  concurso_alvo: z.string().min(1, 'Concurso alvo é obrigatório'),
  tmp_acad: z.string().min(1, 'Obrigatório'),
  tmp_estudos: z.string().min(1, 'Obrigatório'),
  hrs_est_dia: z.string().min(1, 'Obrigatório'),
  maior_dif: z.string().min(1, 'Obrigatório'),
  top_obj: z.string().min(1, 'Obrigatório'),
  int_perito: z.string().min(1, 'Obrigatório'),
  renda: z.string().min(1, 'Obrigatório'),
  inv_prep: z.string().min(1, 'Obrigatório'),
  dias_ment: z.array(z.string()).min(1, 'Selecione ao menos um dia'),
})

const DIAS_OPTIONS = [
  { id: 'SEG', label: 'Segunda-feira' },
  { id: 'TER', label: 'Terça-feira' },
  { id: 'QUA', label: 'Quarta-feira' },
  { id: 'QUI', label: 'Quinta-feira' },
  { id: 'SEXT', label: 'Sexta-feira' },
  { id: 'SÁB', label: 'Sábado' },
]

export default function Cadastro() {
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      area_grad: '',
      concurso_alvo: '',
      tmp_acad: '',
      tmp_estudos: '',
      hrs_est_dia: '',
      maior_dif: '',
      top_obj: '',
      int_perito: '',
      renda: '',
      inv_prep: '',
      dias_ment: [],
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await pb.collection('Leads').create({
        ...values,
        etapa_pipeline: '1. Novo Lead',
      })
      setIsSuccess(true)
      toast.success('Formulário enviado com sucesso!')
    } catch (err) {
      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { type: 'server', message: msg })
        })
      } else {
        toast.error('Ocorreu um erro ao enviar o formulário. Tente novamente.')
      }
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Inscrição Recebida!</h2>
          <p className="text-zinc-400">
            Agradecemos o seu interesse. Nossa equipe avaliará seu perfil e entrará em contato em
            breve para agendarmos a sua consultoria gratuita.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-500/30">
      <div className="w-full max-w-3xl">
        {/* Header & Branding */}
        <div className="text-center mb-10 space-y-6">
          <div className="mx-auto flex items-center justify-center overflow-hidden mb-6">
            <img src={logoUrl} alt="Perícia Foco" className="h-28 object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Consultoria de Estudos para Concursos Periciais
          </h1>
          <div className="text-zinc-300 space-y-4 text-left sm:text-center text-lg leading-relaxed max-w-2xl mx-auto">
            <p>
              Se você busca aprovação em concursos da área pericial (Perito Criminal, Auxiliar de
              Perícia, Papiloscopista, Auxiliar de Necrópsia, Médico-Legista, entre outros),
              preencha este formulário para agendar uma consultoria individual e gratuita com nossa
              equipe.
            </p>
            <p>
              Meu nome é Guilherme Ortega, Perito Criminal Oficial e mentor de preparação para
              concursos na área de segurança pública e perícia. Nosso objetivo é ajudar você a
              estruturar seus estudos de forma estratégica, otimizando seu tempo e maximizando seus
              resultados nas provas.
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-sm text-amber-200/80 text-left space-y-2 mt-6 max-w-2xl mx-auto">
            <p>
              <strong className="text-amber-500">Observação 1:</strong> As vagas para consultoria
              individual são limitadas e sujeitas à análise do seu perfil.
            </p>
            <p>
              <strong className="text-amber-500">Observação 2:</strong> Preencha todos os campos com
              máxima atenção e sinceridade para que possamos direcionar o melhor atendimento.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#18181b] border border-[#27272a] shadow-2xl rounded-2xl p-6 sm:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white border-b border-[#27272a] pb-2">
                  Informações Pessoais
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Nome Completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Seu nome"
                            className="bg-[#09090b] border-[#27272a] text-white focus-visible:ring-amber-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">E-mail</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="seu@email.com"
                            type="email"
                            className="bg-[#09090b] border-[#27272a] text-white focus-visible:ring-amber-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Telefone (WhatsApp)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(11) 99999-9999"
                            className="bg-[#09090b] border-[#27272a] text-white focus-visible:ring-amber-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-xl font-semibold text-white border-b border-[#27272a] pb-2">
                  Perfil Acadêmico e Concurso
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="area_grad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Área de Graduação</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Farmácia, Direito, Biologia..."
                            className="bg-[#09090b] border-[#27272a] text-white focus-visible:ring-amber-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="concurso_alvo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Concurso Alvo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Perito Criminal SP"
                            className="bg-[#09090b] border-[#27272a] text-white focus-visible:ring-amber-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tmp_acad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Momento Acadêmico</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white focus:ring-amber-500">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                            <SelectItem value="Formado ou últimos 3 anos">
                              Formado ou últimos 3 anos
                            </SelectItem>
                            <SelectItem value="Primeiros anos da graduação">
                              Primeiros anos da graduação
                            </SelectItem>
                            <SelectItem value="Sem graduação aderente">
                              Sem graduação aderente
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="int_perito"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Interesse em ser Perito(a)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white focus:ring-amber-500">
                              <SelectValue placeholder="Selecione uma opção" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                            <SelectItem value="100% decidido">100% decidido(a)</SelectItem>
                            <SelectItem value="Ainda avaliando">Ainda avaliando</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-xl font-semibold text-white border-b border-[#27272a] pb-2">
                  Rotina de Estudos
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tmp_estudos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Tempo de Estudos</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white focus:ring-amber-500">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                            <SelectItem value="Iniciante">Iniciante (Começando agora)</SelectItem>
                            <SelectItem value="Intermediario">Intermediário</SelectItem>
                            <SelectItem value="Avancado">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hrs_est_dia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Horas de Estudo por Dia</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white focus:ring-amber-500">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                            <SelectItem value="1-2h">1 a 2 horas</SelectItem>
                            <SelectItem value="3-4h">3 a 4 horas</SelectItem>
                            <SelectItem value="5-6h">5 a 6 horas</SelectItem>
                            <SelectItem value="7h+">7+ horas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="maior_dif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">
                          Maior dificuldade ou desafio na sua preparação
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white focus:ring-amber-500">
                              <SelectValue placeholder="Selecione o seu maior desafio atual" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                            <SelectItem value="Não sei por onde começar">
                              Não sei por onde começar
                            </SelectItem>
                            <SelectItem value="Falta de organização">
                              Falta de organização
                            </SelectItem>
                            <SelectItem value="Falta de constância (disciplina)">
                              Falta de constância (disciplina)
                            </SelectItem>
                            <SelectItem value="Não sei estudar a parte técnica (materiais e legislação)">
                              Não sei estudar a parte técnica (materiais e legislação)
                            </SelectItem>
                            <SelectItem value="Não consigo evoluir nas questões/simulados">
                              Não consigo evoluir nas questões/simulados
                            </SelectItem>
                            <SelectItem value="Não tenho um plano claro para aprovação">
                              Não tenho um plano claro para aprovação
                            </SelectItem>
                            <SelectItem value="Outros motivos">Outros motivos</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="top_obj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Objetivo principal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white focus:ring-amber-500">
                              <SelectValue placeholder="O que você mais busca resolver hoje?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                            <SelectItem value="Ser aprovado no concurso de Perito">
                              Ser aprovado no concurso de Perito
                            </SelectItem>
                            <SelectItem value="Melhorar drasticamente meu método de estudos">
                              Melhorar drasticamente meu método de estudos
                            </SelectItem>
                            <SelectItem value="Evoluir significativamente nos simulados (melhorar % de acertos)">
                              Evoluir significativamente nos simulados (melhorar % de acertos)
                            </SelectItem>
                            <SelectItem value="Melhorar minha organização e ter mais controle sobre o ciclo de estudos">
                              Melhorar minha organização e ter mais controle sobre o ciclo de
                              estudos
                            </SelectItem>
                            <SelectItem value="Entender se estou no caminho certo e ter clareza">
                              Entender se estou no caminho certo e ter clareza
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-xl font-semibold text-white border-b border-[#27272a] pb-2">
                  Disponibilidade financeira e agenda
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4">
                  <FormField
                    control={form.control}
                    name="renda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Situação de Renda</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white focus:ring-amber-500">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                            <SelectItem value="Possui renda própria">
                              Possui renda própria
                            </SelectItem>
                            <SelectItem value="Sem renda própria">Sem renda própria</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inv_prep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Investimento em Preparação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white focus:ring-amber-500">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                            <SelectItem value="Até R$ 500">Até R$ 500</SelectItem>
                            <SelectItem value="R$ 500-1000">R$ 500-1000</SelectItem>
                            <SelectItem value="+ R$ 1000">+ R$ 1000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dias_ment"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-zinc-300 text-base">
                          Dias Disponíveis para Mentoria
                        </FormLabel>
                        <FormDescription className="text-zinc-500">
                          Selecione os dias da semana em que você teria disponibilidade para a
                          consultoria.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {DIAS_OPTIONS.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="dias_ment"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#27272a] bg-[#09090b]/50 p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      className="border-zinc-700 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black"
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, item.id])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== item.id),
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-zinc-300 cursor-pointer">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-medium bg-amber-500 hover:bg-amber-600 text-black rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Enviando...' : 'Quero agendar minha consultoria'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
