onRecordUpdate((e) => {
  var record = e.record

  var score = 0

  var intPerito = record.getString('int_perito')
  if (intPerito === '100% decidido') {
    score += 40
  } else if (intPerito === 'Ainda avaliando') {
    score += 20
  }

  var tmpAcad = record.getString('tmp_acad')
  if (tmpAcad === 'Formado ou últimos 3 anos') {
    score += 30
  } else if (tmpAcad === 'Primeiros anos da graduação') {
    score += 15
  }

  var renda = record.getString('renda')
  if (renda === 'Possui renda própria') {
    score += 30
  } else if (renda === 'Sem renda própria') {
    score += 10
  }

  record.set('score_comerc', score)

  if (tmpAcad === 'Sem graduação aderente') {
    var existingNotes = record.getString('historico_notas')
    var flag = '[BAIXA PRIORIDADE] Perfil sem graduação aderente - sugerir produto low-ticket.'
    if (existingNotes.indexOf(flag) === -1) {
      record.set('historico_notas', flag + (existingNotes ? '\n' + existingNotes : ''))
    }
  }

  var etapa = record.getString('etapa_pipeline') || '1. Novo Lead'

  if (
    tmpAcad === 'Sem graduação aderente' &&
    record.original().getString('tmp_acad') !== 'Sem graduação aderente'
  ) {
    var existingNotes = record.getString('historico_notas') || ''
    var flag = '[BAIXA PRIORIDADE] Perfil sem graduação aderente - sugerir produto low-ticket.'
    if (existingNotes.indexOf(flag) === -1) {
      record.set('historico_notas', flag + (existingNotes ? '\n' + existingNotes : ''))
    }
    record.set('etapa_pipeline', '5. Lead em Nutrição')

    var tags = record.getString('tags') || ''
    if (tags.indexOf('produto_low_ticket') === -1) {
      record.set('tags', tags ? tags + ', produto_low_ticket' : 'produto_low_ticket')
    }
  } else if (
    (etapa === 'Triagem / Qualificação' || etapa === '1. Novo Lead') &&
    (score !== record.original().getInt('score_comerc') ||
      tmpAcad !== record.original().getString('tmp_acad') ||
      intPerito !== record.original().getString('int_perito') ||
      renda !== record.original().getString('renda'))
  ) {
    if (score >= 80) {
      record.set('etapa_pipeline', '3. Lead Premium')
    } else if (score >= 60) {
      record.set('etapa_pipeline', '4. Lead Qualificado')
    } else if (score >= 40) {
      record.set('etapa_pipeline', '5. Lead em Nutrição')
    } else {
      record.set('etapa_pipeline', '1. Novo Lead')
    }
  }

  e.next()
}, 'Leads')
