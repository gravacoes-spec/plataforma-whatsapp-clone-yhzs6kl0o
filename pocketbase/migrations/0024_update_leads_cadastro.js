migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')

    // Allow public access for form submissions
    col.createRule = ''

    // Add dias_ment
    if (!col.fields.getByName('dias_ment')) {
      col.fields.add(
        new SelectField({
          name: 'dias_ment',
          values: ['SEG', 'TER', 'QUA', 'QUI', 'SEXT', 'SÁB'],
          maxSelect: 6,
        }),
      )
    }

    // Update etapa_pipeline to include new mapping stages
    const oldEtapa = col.fields.getByName('etapa_pipeline')
    if (oldEtapa) {
      col.fields.removeByName('etapa_pipeline')
      col.fields.add(
        new SelectField({
          name: 'etapa_pipeline',
          values: [
            'Triagem / Qualificação',
            '3. Lead Premium',
            '4. Lead Qualificado',
            '5. Lead em Nutrição',
            'Novo',
            'Contatado',
            'Apresentacao',
            'Negociacao',
            'Ganho',
            'Perdido',
            '1. Novo Lead',
            '2. Abordagem',
            '6. Agendamento de Consultoria',
            '7. Negociação',
            '8. Venda Realizada',
            '9. Follow-up',
            '10. Lead Desqualificado/Perda',
          ],
          maxSelect: 1,
        }),
      )
    }

    // Update maior_dif
    const oldMaiorDif = col.fields.getByName('maior_dif')
    if (oldMaiorDif) {
      col.fields.removeByName('maior_dif')
      col.fields.add(
        new SelectField({
          name: 'maior_dif',
          values: [
            'Tempo',
            'Disciplina',
            'Metodo',
            'Recursos',
            'Outro',
            'Não sei por onde começar',
            'Falta de organização',
            'Falta de constância (disciplina)',
            'Não sei estudar a parte técnica (materiais e legislação)',
            'Não consigo evoluir nas questões/simulados',
            'Não tenho um plano claro para aprovação',
            'Outros motivos',
          ],
          maxSelect: 1,
        }),
      )
    }

    // Update top_obj
    const oldTopObj = col.fields.getByName('top_obj')
    if (oldTopObj) {
      col.fields.removeByName('top_obj')
      col.fields.add(
        new SelectField({
          name: 'top_obj',
          values: [
            'Aprovacao',
            'Estabilidade',
            'Realizacao Pessoal',
            'Outro',
            'Ser aprovado no concurso de Perito',
            'Melhorar drasticamente meu método de estudos',
            'Evoluir significativamente nos simulados (melhorar % de acertos)',
            'Melhorar minha organização e ter mais controle sobre o ciclo de estudos',
            'Entender se estou no caminho certo e ter clareza',
          ],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')

    col.createRule =
      "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || @request.auth.perfil_acess = 'Vendedor')"

    if (col.fields.getByName('dias_ment')) {
      col.fields.removeByName('dias_ment')
    }

    // restore etapa_pipeline
    const oldEtapa = col.fields.getByName('etapa_pipeline')
    if (oldEtapa) {
      col.fields.removeByName('etapa_pipeline')
      col.fields.add(
        new SelectField({
          name: 'etapa_pipeline',
          values: [
            'Triagem / Qualificação',
            '3. Lead Premium',
            '4. Lead Qualificado',
            '5. Lead em Nutrição',
            'Novo',
            'Contatado',
            'Apresentacao',
            'Negociacao',
            'Ganho',
            'Perdido',
          ],
          maxSelect: 1,
        }),
      )
    }

    // restore maior_dif
    const oldMaiorDif = col.fields.getByName('maior_dif')
    if (oldMaiorDif) {
      col.fields.removeByName('maior_dif')
      col.fields.add(
        new SelectField({
          name: 'maior_dif',
          values: ['Tempo', 'Disciplina', 'Metodo', 'Recursos', 'Outro'],
          maxSelect: 1,
        }),
      )
    }

    // restore top_obj
    const oldTopObj = col.fields.getByName('top_obj')
    if (oldTopObj) {
      col.fields.removeByName('top_obj')
      col.fields.add(
        new SelectField({
          name: 'top_obj',
          values: ['Aprovacao', 'Estabilidade', 'Realizacao Pessoal', 'Outro'],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
)
