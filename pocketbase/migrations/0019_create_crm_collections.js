migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!usersCol.fields.getByName('perfil_acess')) {
      usersCol.fields.add(
        new SelectField({
          name: 'perfil_acess',
          values: ['Gestor', 'Vendedor', 'Suporte', 'Mentor(a)'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    usersCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || id = @request.auth.id)"
    usersCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || id = @request.auth.id)"
    usersCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || id = @request.auth.id)"
    usersCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || id = @request.auth.id)"
    app.save(usersCol)

    const leadsCol = new Collection({
      name: 'Leads',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || (@request.auth.perfil_acess = 'Vendedor' && vend_resp = @request.auth.id))",
      viewRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || (@request.auth.perfil_acess = 'Vendedor' && vend_resp = @request.auth.id))",
      createRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || @request.auth.perfil_acess = 'Vendedor')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || (@request.auth.perfil_acess = 'Vendedor' && vend_resp = @request.auth.id))",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      fields: [
        { name: 'name', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'vend_resp', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'etapa_pipeline',
          type: 'select',
          values: [
            'Novo',
            'Contatado',
            'Qualificado',
            'Apresentacao',
            'Negociacao',
            'Ganho',
            'Perdido',
          ],
          maxSelect: 1,
        },
        { name: 'int_perito', type: 'select', values: ['Sim', 'Nao', 'Talvez'], maxSelect: 1 },
        { name: 'area_grad', type: 'text' },
        {
          name: 'tmp_acad',
          type: 'select',
          values: ['Ensino Medio', 'Graduacao', 'Pos-Graduacao', 'Doutorado'],
          maxSelect: 1,
        },
        {
          name: 'renda',
          type: 'select',
          values: ['Ate 2k', '2k-5k', '5k-10k', '10k+'],
          maxSelect: 1,
        },
        { name: 'score_comerc', type: 'number' },
        {
          name: 'motivo_perda',
          type: 'select',
          values: ['Preco', 'Concorrencia', 'Desistiu', 'Sem Fit', 'Outro'],
          maxSelect: 1,
        },
        { name: 'historico_notas', type: 'text' },
        { name: 'concurso_alvo', type: 'text' },
        {
          name: 'tmp_estudos',
          type: 'select',
          values: ['Iniciante', 'Intermediario', 'Avancado'],
          maxSelect: 1,
        },
        {
          name: 'hrs_est_dia',
          type: 'select',
          values: ['1-2h', '3-4h', '5-6h', '7h+'],
          maxSelect: 1,
        },
        {
          name: 'maior_dif',
          type: 'select',
          values: ['Tempo', 'Disciplina', 'Metodo', 'Recursos', 'Outro'],
          maxSelect: 1,
        },
        {
          name: 'top_obj',
          type: 'select',
          values: ['Aprovacao', 'Estabilidade', 'Realizacao Pessoal', 'Outro'],
          maxSelect: 1,
        },
        { name: 'inv_prep', type: 'select', values: ['Baixo', 'Medio', 'Alto'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_leads_vend_resp ON Leads (vend_resp)'],
    })
    app.save(leadsCol)

    const metasCol = new Collection({
      name: 'Metas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      createRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      fields: [
        { name: 'vend_resp', type: 'relation', collectionId: leadsCol.id, maxSelect: 1 },
        { name: 'periodo_in', type: 'date' },
        { name: 'periodo_fin', type: 'date' },
        { name: 'm_leads_recebidos', type: 'number' },
        { name: 'm_abord_prospec_ativa', type: 'number' },
        { name: 'm_apresent_consult', type: 'number' },
        { name: 'm_vendas', type: 'number' },
        { name: 'm_faturamento', type: 'number' },
        { name: 'r_leads_recebidos', type: 'number' },
        { name: 'r_abord_prospec_ativa', type: 'number' },
        { name: 'r_apresent_consult', type: 'number' },
        { name: 'r_vendas', type: 'number' },
        { name: 'r_faturamento', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(metasCol)

    const bdClientesCol = new Collection({
      name: 'bd_clientes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || (@request.auth.perfil_acess = 'Mentor(a)' && Mentor_a = @request.auth.id))",
      viewRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || (@request.auth.perfil_acess = 'Mentor(a)' && Mentor_a = @request.auth.id))",
      createRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || (@request.auth.perfil_acess = 'Mentor(a)' && Mentor_a = @request.auth.id))",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      fields: [
        { name: 'Aluno_a', type: 'text' },
        { name: 'Mentor_a', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'Telefone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'Cidade', type: 'text' },
        { name: 'UF', type: 'text' },
        { name: 'CEP', type: 'text' },
        { name: 'Vend_Resp_Lead', type: 'relation', collectionId: leadsCol.id, maxSelect: 1 },
        { name: 'Vend_Resp_User', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'Nome_Prod', type: 'text' },
        { name: 'Tp_Pgto', type: 'text' },
        { name: 'Vlr_Pago', type: 'number' },
        { name: 'Data_inicio', type: 'date' },
        { name: 'Data_term', type: 'date' },
        { name: 'Renov', type: 'text' },
        { name: 'area_grad', type: 'text' },
        { name: 'concurso_alvo', type: 'text' },
        { name: 'tmp_estudos', type: 'text' },
        { name: 'hrs_est_dia', type: 'text' },
        { name: 'maior_dif', type: 'text' },
        { name: 'top_obj', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_bd_mentor ON bd_clientes (Mentor_a)'],
    })
    app.save(bdClientesCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('bd_clientes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('Metas'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('Leads'))
    } catch (_) {}

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      usersCol.fields.removeByName('perfil_acess')
    } catch (_) {}
    usersCol.listRule = 'id = @request.auth.id'
    usersCol.viewRule = 'id = @request.auth.id'
    usersCol.createRule = ''
    usersCol.updateRule = 'id = @request.auth.id'
    usersCol.deleteRule = 'id = @request.auth.id'
    app.save(usersCol)
  },
)
