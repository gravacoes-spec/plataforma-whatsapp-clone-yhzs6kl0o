migrate(
  (app) => {
    let adminId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'guilhermeheortega@gmail.com')
      admin.set('perfil_acess', 'Gestor')
      app.save(admin)
      adminId = admin.id
    } catch (_) {}

    if (!adminId) return

    const leadsCol = app.findCollectionByNameOrId('Leads')

    var sampleLeads = [
      {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '11987654321',
        etapa_pipeline: 'Qualificado',
        int_perito: 'Sim',
        area_grad: 'Direito',
        tmp_acad: 'Graduacao',
        renda: '2k-5k',
        score_comerc: 8,
        concurso_alvo: 'OAB',
        tmp_estudos: 'Intermediario',
        hrs_est_dia: '3-4h',
        maior_dif: 'Tempo',
        top_obj: 'Aprovacao',
        inv_prep: 'Medio',
        historico_notas: 'Primeiro contato realizado. Cliente muito interessado na mentoria.',
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '11912345678',
        etapa_pipeline: 'Apresentacao',
        int_perito: 'Sim',
        area_grad: 'Medicina',
        tmp_acad: 'Pos-Graduacao',
        renda: '5k-10k',
        score_comerc: 9,
        concurso_alvo: 'Revalida',
        tmp_estudos: 'Avancado',
        hrs_est_dia: '5-6h',
        maior_dif: 'Metodo',
        top_obj: 'Aprovacao',
        inv_prep: 'Alto',
        historico_notas: 'Apresentação realizada. Aguardando decisão final do cliente.',
      },
      {
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        phone: '11999998888',
        etapa_pipeline: 'Novo',
        int_perito: 'Talvez',
        area_grad: 'Engenharia',
        tmp_acad: 'Graduacao',
        renda: 'Ate 2k',
        score_comerc: 5,
        concurso_alvo: 'Concurso Público Federal',
        tmp_estudos: 'Iniciante',
        hrs_est_dia: '1-2h',
        maior_dif: 'Disciplina',
        top_obj: 'Estabilidade',
        inv_prep: 'Baixo',
        historico_notas: 'Lead novo recebido, aguardando primeiro contato do vendedor.',
      },
      {
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        phone: '1188887777',
        etapa_pipeline: 'Ganho',
        int_perito: 'Sim',
        area_grad: 'Contabilidade',
        tmp_acad: 'Graduacao',
        renda: '2k-5k',
        score_comerc: 10,
        concurso_alvo: 'CRC',
        tmp_estudos: 'Intermediario',
        hrs_est_dia: '3-4h',
        maior_dif: 'Recursos',
        top_obj: 'Realizacao Pessoal',
        inv_prep: 'Alto',
        historico_notas: 'Venda concluída com sucesso. Cliente migrado para o bd_clientes.',
      },
      {
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@email.com',
        phone: '1177776666',
        etapa_pipeline: 'Perdido',
        int_perito: 'Nao',
        area_grad: 'Administracao',
        tmp_acad: 'Ensino Medio',
        renda: 'Ate 2k',
        score_comerc: 3,
        motivo_perda: 'Preco',
        concurso_alvo: 'Concurso Estadual',
        tmp_estudos: 'Iniciante',
        hrs_est_dia: '1-2h',
        maior_dif: 'Tempo',
        top_obj: 'Estabilidade',
        inv_prep: 'Baixo',
        historico_notas:
          'Cliente desistiu por questões orçamentárias. Possível retomada no futuro.',
      },
    ]

    var leadIds = []
    for (var i = 0; i < sampleLeads.length; i++) {
      var ld = sampleLeads[i]
      try {
        app.findFirstRecordByData('Leads', 'email', ld.email)
      } catch (_) {
        var record = new Record(leadsCol)
        record.set('name', ld.name)
        record.set('email', ld.email)
        record.set('phone', ld.phone)
        record.set('vend_resp', adminId)
        record.set('etapa_pipeline', ld.etapa_pipeline)
        record.set('int_perito', ld.int_perito)
        record.set('area_grad', ld.area_grad)
        record.set('tmp_acad', ld.tmp_acad)
        record.set('renda', ld.renda)
        record.set('score_comerc', ld.score_comerc)
        if (ld.motivo_perda) record.set('motivo_perda', ld.motivo_perda)
        record.set('historico_notas', ld.historico_notas)
        record.set('concurso_alvo', ld.concurso_alvo)
        record.set('tmp_estudos', ld.tmp_estudos)
        record.set('hrs_est_dia', ld.hrs_est_dia)
        record.set('maior_dif', ld.maior_dif)
        record.set('top_obj', ld.top_obj)
        record.set('inv_prep', ld.inv_prep)
        app.save(record)
        leadIds.push(record.id)
      }
    }

    if (leadIds.length === 0) return

    var metasCol = app.findCollectionByNameOrId('Metas')
    try {
      app.findFirstRecordByData('Metas', 'vend_resp', leadIds[0])
    } catch (_) {
      var metasRecord = new Record(metasCol)
      metasRecord.set('vend_resp', leadIds[0])
      metasRecord.set('periodo_in', '2026-01-01 00:00:00.000Z')
      metasRecord.set('periodo_fin', '2026-12-31 23:59:59.000Z')
      metasRecord.set('m_leads_recebidos', 100)
      metasRecord.set('m_abord_prospec_ativa', 80)
      metasRecord.set('m_apresent_consult', 50)
      metasRecord.set('m_vendas', 30)
      metasRecord.set('m_faturamento', 50000)
      metasRecord.set('r_leads_recebidos', 45)
      metasRecord.set('r_abord_prospec_ativa', 35)
      metasRecord.set('r_apresent_consult', 20)
      metasRecord.set('r_vendas', 12)
      metasRecord.set('r_faturamento', 18000)
      app.save(metasRecord)
    }

    var bdCol = app.findCollectionByNameOrId('bd_clientes')
    try {
      app.findFirstRecordByData('bd_clientes', 'Vend_Resp_Lead', leadIds[3] || leadIds[0])
    } catch (_) {
      var bdRecord = new Record(bdCol)
      bdRecord.set('Aluno_a', 'Ana Costa')
      bdRecord.set('Mentor_a', adminId)
      bdRecord.set('Telefone', '1188887777')
      bdRecord.set('email', 'ana.costa@email.com')
      bdRecord.set('Cidade', 'São Paulo')
      bdRecord.set('UF', 'SP')
      bdRecord.set('CEP', '01310-000')
      bdRecord.set('Vend_Resp_Lead', leadIds[3] || leadIds[0])
      bdRecord.set('Vend_Resp_User', adminId)
      bdRecord.set('Nome_Prod', 'Mentoria Premium 6 meses')
      bdRecord.set('Tp_Pgto', 'Cartão 12x')
      bdRecord.set('Vlr_Pago', 3600)
      bdRecord.set('Data_inicio', '2026-01-15 00:00:00.000Z')
      bdRecord.set('Data_term', '2026-07-15 00:00:00.000Z')
      bdRecord.set('Renov', 'Em analise')
      bdRecord.set('area_grad', 'Contabilidade')
      bdRecord.set('concurso_alvo', 'CRC')
      bdRecord.set('tmp_estudos', 'Intermediario')
      bdRecord.set('hrs_est_dia', '3-4h')
      bdRecord.set('maior_dif', 'Recursos')
      bdRecord.set('top_obj', 'Realizacao Pessoal')
      app.save(bdRecord)
    }
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('Metas'))
    } catch (_) {}
    try {
      app.truncateCollection(app.findCollectionByNameOrId('bd_clientes'))
    } catch (_) {}
    try {
      app.truncateCollection(app.findCollectionByNameOrId('Leads'))
    } catch (_) {}
  },
)
