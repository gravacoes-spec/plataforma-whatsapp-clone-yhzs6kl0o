migrate(
  (app) => {
    // --- webhook_log ---
    const webhookLogCol = new Collection({
      name: 'webhook_log',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.perfil_acess = 'Gestor'",
      viewRule: "@request.auth.id != '' && @request.auth.perfil_acess = 'Gestor'",
      createRule: '',
      updateRule: "@request.auth.id != '' && @request.auth.perfil_acess = 'Gestor'",
      deleteRule: "@request.auth.id != '' && @request.auth.perfil_acess = 'Gestor'",
      fields: [
        { name: 'status', type: 'text' },
        { name: 'origem', type: 'text' },
        { name: 'payload_receb', type: 'json' },
        { name: 'data_receb', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(webhookLogCol)

    // --- vendas_hotmart ---
    const vendasHotmartCol = new Collection({
      name: 'vendas_hotmart',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || @request.auth.perfil_acess = 'Vendedor')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte' || @request.auth.perfil_acess = 'Vendedor')",
      createRule: '',
      updateRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      deleteRule: "@request.auth.id != '' && @request.auth.perfil_acess = 'Gestor'",
      fields: [
        { name: 'id_evento', type: 'text' },
        { name: 'tipo_evento', type: 'text' },
        { name: 'transacao', type: 'text' },
        { name: 'status_compra', type: 'text' },
        { name: 'data_pedido', type: 'date' },
        { name: 'nome_produto', type: 'text' },
        { name: 'nome_comprador', type: 'text' },
        { name: 'email_comprador', type: 'email' },
        { name: 'telefone_comprador', type: 'text' },
        { name: 'documento_comprador', type: 'text' },
        { name: 'cidade_comprador', type: 'text' },
        { name: 'estado_comprador', type: 'text' },
        { name: 'meio_pagamento', type: 'text' },
        { name: 'parcelas', type: 'number' },
        { name: 'preco_total', type: 'number' },
        { name: 'moeda', type: 'text' },
        { name: 'comissao_produtor', type: 'number' },
        { name: 'nome_afiliado', type: 'text' },
        { name: 'valor_frete', type: 'number' },
        { name: 'status_assinatura', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_vh_email ON vendas_hotmart (email_comprador)',
        'CREATE INDEX idx_vh_transacao ON vendas_hotmart (transacao)',
      ],
    })
    app.save(vendasHotmartCol)

    // --- bd_mentor ---
    const bdMentorCol = new Collection({
      name: 'bd_mentor',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      deleteRule: "@request.auth.id != '' && @request.auth.perfil_acess = 'Gestor'",
      fields: [
        { name: 'nome', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        {
          name: 'aluno_vinculado',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('bd_clientes').id,
          maxSelect: 1,
        },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_bdm_email ON bd_mentor (email)'],
    })
    app.save(bdMentorCol)

    // --- tasks ---
    const tasksCol = new Collection({
      name: 'tasks',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      viewRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      deleteRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.perfil_acess = 'Gestor' || @request.auth.perfil_acess = 'Suporte')",
      fields: [
        { name: 'description', type: 'text' },
        { name: 'due_date', type: 'date' },
        { name: 'completed', type: 'bool' },
        { name: 'user_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'lead_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('Leads').id,
          maxSelect: 1,
        },
        {
          name: 'client_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('bd_clientes').id,
          maxSelect: 1,
        },
        { name: 'mentor_id', type: 'relation', collectionId: bdMentorCol.id, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tasks_user ON tasks (user_id)',
        'CREATE INDEX idx_tasks_due ON tasks (due_date)',
      ],
    })
    app.save(tasksCol)

    // --- Indexes on Leads: email and phone ---
    const leadsCol = app.findCollectionByNameOrId('Leads')
    leadsCol.addIndex('idx_leads_email', false, 'email', '')
    leadsCol.addIndex('idx_leads_phone', false, 'phone', '')
    app.save(leadsCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('tasks'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('bd_mentor'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('vendas_hotmart'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('webhook_log'))
    } catch (_) {}

    try {
      const leadsCol = app.findCollectionByNameOrId('Leads')
      leadsCol.removeIndex('idx_leads_email')
      leadsCol.removeIndex('idx_leads_phone')
      app.save(leadsCol)
    } catch (_) {}
  },
)
