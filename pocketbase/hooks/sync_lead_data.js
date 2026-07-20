onRecordAfterUpdateSuccess((e) => {
  const lead = e.record

  const nameChanged = lead.getString('name') !== lead.original().getString('name')
  const phoneChanged = lead.getString('phone') !== lead.original().getString('phone')
  const emailChanged = lead.getString('email') !== lead.original().getString('email')
  const areaChanged = lead.getString('area_grad') !== lead.original().getString('area_grad')
  const concursoChanged =
    lead.getString('concurso_alvo') !== lead.original().getString('concurso_alvo')
  const tmpEstudosChanged =
    lead.getString('tmp_estudos') !== lead.original().getString('tmp_estudos')
  const hrsEstudosChanged =
    lead.getString('hrs_est_dia') !== lead.original().getString('hrs_est_dia')
  const maiorDifChanged = lead.getString('maior_dif') !== lead.original().getString('maior_dif')
  const topObjChanged = lead.getString('top_obj') !== lead.original().getString('top_obj')

  if (
    !nameChanged &&
    !phoneChanged &&
    !emailChanged &&
    !areaChanged &&
    !concursoChanged &&
    !tmpEstudosChanged &&
    !hrsEstudosChanged &&
    !maiorDifChanged &&
    !topObjChanged
  ) {
    return e.next()
  }

  const leadId = lead.id
  const leadName = lead.getString('name')
  const leadPhone = lead.getString('phone')
  const leadEmail = lead.getString('email')

  try {
    const clientes = $app.findRecordsByFilter(
      'bd_clientes',
      'Vend_Resp_Lead = "' + leadId + '"',
      '-created',
      200,
      0,
    )
    for (var i = 0; i < clientes.length; i++) {
      var c = clientes[i]
      if (leadName) c.set('Aluno_a', leadName)
      if (leadEmail) c.set('email', leadEmail)
      if (leadPhone) c.set('Telefone', leadPhone)
      if (areaChanged) c.set('area_grad', lead.getString('area_grad'))
      if (concursoChanged) c.set('concurso_alvo', lead.getString('concurso_alvo'))
      if (tmpEstudosChanged) c.set('tmp_estudos', lead.getString('tmp_estudos'))
      if (hrsEstudosChanged) c.set('hrs_est_dia', lead.getString('hrs_est_dia'))
      if (maiorDifChanged) c.set('maior_dif', lead.getString('maior_dif'))
      if (topObjChanged) c.set('top_obj', lead.getString('top_obj'))
      $app.saveNoValidate(c)
    }
  } catch (err) {
    $app.logger().error('sync_lead_data: bd_clientes sync failed', 'error', String(err))
  }

  if (leadPhone) {
    var cleanPhone = leadPhone.replace(/\D/g, '')
    if (cleanPhone.length >= 8) {
      var lastDigits = cleanPhone.slice(-10)
      try {
        var contacts = $app.findRecordsByFilter(
          'whatsapp_contacts',
          'phone ~ "' + lastDigits + '"',
          '-created',
          50,
          0,
        )
        for (var j = 0; j < contacts.length; j++) {
          var ct = contacts[j]
          if (leadName) ct.set('name', leadName)
          $app.saveNoValidate(ct)
        }
      } catch (err2) {
        $app.logger().error('sync_lead_data: whatsapp_contacts sync failed', 'error', String(err2))
      }
    }
  }

  return e.next()
}, 'Leads')
