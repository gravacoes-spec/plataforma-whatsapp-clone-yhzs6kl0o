onRecordAfterUpdateSuccess((e) => {
  const cliente = e.record

  const nameChanged = cliente.getString('Aluno_a') !== cliente.original().getString('Aluno_a')
  const phoneChanged = cliente.getString('Telefone') !== cliente.original().getString('Telefone')
  const emailChanged = cliente.getString('email') !== cliente.original().getString('email')
  const areaChanged = cliente.getString('area_grad') !== cliente.original().getString('area_grad')
  const concursoChanged =
    cliente.getString('concurso_alvo') !== cliente.original().getString('concurso_alvo')
  const tmpEstudosChanged =
    cliente.getString('tmp_estudos') !== cliente.original().getString('tmp_estudos')
  const hrsEstudosChanged =
    cliente.getString('hrs_est_dia') !== cliente.original().getString('hrs_est_dia')
  const maiorDifChanged =
    cliente.getString('maior_dif') !== cliente.original().getString('maior_dif')
  const topObjChanged = cliente.getString('top_obj') !== cliente.original().getString('top_obj')

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

  const name = cliente.getString('Aluno_a')
  const phone = cliente.getString('Telefone')
  const email = cliente.getString('email')
  const leadId = cliente.getString('Vend_Resp_Lead')

  // Sync back to Leads if linked
  if (leadId) {
    try {
      const lead = $app.findRecordById('Leads', leadId)
      if (nameChanged) lead.set('name', name)
      if (emailChanged) lead.set('email', email)
      if (phoneChanged) lead.set('phone', phone)
      if (areaChanged) lead.set('area_grad', cliente.getString('area_grad'))
      if (concursoChanged) lead.set('concurso_alvo', cliente.getString('concurso_alvo'))
      if (tmpEstudosChanged) lead.set('tmp_estudos', cliente.getString('tmp_estudos'))
      if (hrsEstudosChanged) lead.set('hrs_est_dia', cliente.getString('hrs_est_dia'))
      if (maiorDifChanged) lead.set('maior_dif', cliente.getString('maior_dif'))
      if (topObjChanged) lead.set('top_obj', cliente.getString('top_obj'))
      $app.saveNoValidate(lead)
    } catch (err) {
      $app.logger().error('sync_cliente_data: Leads sync failed', 'error', String(err))
    }
  }

  // Sync to Whatsapp Contacts
  if (phone) {
    var cleanPhone = phone.replace(/\D/g, '')
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
          if (name) ct.set('name', name)
          $app.saveNoValidate(ct)
        }
      } catch (err2) {
        $app
          .logger()
          .error('sync_cliente_data: whatsapp_contacts sync failed', 'error', String(err2))
      }
    }
  }

  return e.next()
}, 'bd_clientes')
