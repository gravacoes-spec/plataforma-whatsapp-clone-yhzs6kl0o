routerAdd('POST', '/api/webhook/hotmart', (e) => {
  const body = e.requestInfo().body || {}

  const hottok =
    e.request.header.get('X-Hotmart-Hottok') || e.requestInfo().headers['x_hotmart_hottok'] || ''
  const expectedToken = $secrets.get('HOTTOK_HOTMART') || ''

  let isTokenValid = true
  if (!expectedToken || hottok !== expectedToken) {
    isTokenValid = false
  }

  const payloadToLog = JSON.parse(JSON.stringify(body))
  delete payloadToLog.hottok
  delete payloadToLog['X-Hotmart-Hottok']

  let logStatus = isTokenValid ? 'received' : 'Invalid Token'
  let logId = ''

  try {
    const logCol = $app.findCollectionByNameOrId('webhook_log')
    const logRecord = new Record(logCol)
    logRecord.set('status', isTokenValid ? 'processing' : 'Invalid Token')
    logRecord.set('origem', 'hotmart')
    logRecord.set('payload_receb', payloadToLog)
    logRecord.set('data_receb', new Date().toISOString())
    $app.saveNoValidate(logRecord)
    logId = logRecord.id
  } catch (err) {
    $app.logger().error('Failed to create webhook_log', 'error', String(err))
  }

  if (!isTokenValid) {
    return e.json(401, { error: 'Unauthorized' })
  }

  try {
    const data = body.data || {}
    const purchase = data.purchase || {}
    const payment = purchase.payment || {}
    const fullPrice = purchase.full_price || {}
    const buyer = data.buyer || {}
    const address = buyer.address || {}
    const commissions = data.commissions || []
    const affiliates = data.affiliates || []
    const subscription = data.subscription || {}
    const shipping = data.shipping || {}
    const shippingCost = shipping.cost || {}

    let comissaoProdutor = 0
    if (Array.isArray(commissions)) {
      for (var c = 0; c < commissions.length; c++) {
        if (commissions[c].source === 'PRODUCER') {
          comissaoProdutor = commissions[c].value || 0
          break
        }
      }
    }

    var telefoneComprador = ''
    var phoneCode = buyer.checkout_phone_code || ''
    var phoneNum = buyer.checkout_phone || ''
    if (phoneCode || phoneNum) {
      telefoneComprador = (phoneCode + ' ' + phoneNum).trim()
    }

    var dataPedido = ''
    var rawOrderDate = purchase.order_date || ''
    if (rawOrderDate) {
      try {
        var parsedDate = new Date(rawOrderDate)
        if (!isNaN(parsedDate.getTime())) {
          dataPedido = parsedDate.toISOString()
        } else {
          dataPedido = rawOrderDate
        }
      } catch (_) {
        dataPedido = rawOrderDate
      }
    }

    var nomeAfiliado = ''
    if (Array.isArray(affiliates) && affiliates.length > 0) {
      nomeAfiliado = affiliates[0].name || ''
    }

    var statusAssinatura = ''
    if (subscription && typeof subscription === 'object') {
      statusAssinatura = subscription.status || ''
    }

    var vendasCol = $app.findCollectionByNameOrId('vendas_hotmart')
    var vendasRecord
    try {
      if (purchase.transaction) {
        vendasRecord = $app.findFirstRecordByData(
          'vendas_hotmart',
          'transacao',
          purchase.transaction,
        )
      } else {
        throw new Error('No transaction ID')
      }
    } catch (_) {
      vendasRecord = new Record(vendasCol)
    }

    vendasRecord.set('id_evento', body.id || '')
    vendasRecord.set('tipo_evento', body.event || '')
    vendasRecord.set('transacao', purchase.transaction || '')
    vendasRecord.set('status_compra', purchase.status || '')
    vendasRecord.set('data_pedido', dataPedido)
    vendasRecord.set('nome_produto', (data.product || {}).name || '')
    vendasRecord.set('nome_comprador', buyer.name || '')
    vendasRecord.set('email_comprador', buyer.email || '')
    vendasRecord.set('telefone_comprador', telefoneComprador)
    vendasRecord.set('documento_comprador', buyer.document || '')
    vendasRecord.set('cidade_comprador', address.city || '')
    vendasRecord.set('estado_comprador', address.state || '')
    vendasRecord.set('meio_pagamento', payment.type || '')
    vendasRecord.set('parcelas', payment.installments_number || 0)
    vendasRecord.set('preco_total', fullPrice.value || 0)
    vendasRecord.set('moeda', fullPrice.currency_value || '')
    vendasRecord.set('comissao_produtor', comissaoProdutor)
    vendasRecord.set('nome_afiliado', nomeAfiliado)
    vendasRecord.set('valor_frete', shippingCost.value || 0)
    vendasRecord.set('status_assinatura', statusAssinatura)

    // SMART LEAD LINKING
    let lead = null
    try {
      const email = buyer.email || ''
      const phone = telefoneComprador || ''
      if (email || phone) {
        let filters = []
        if (email) filters.push(`email = "${email.replace(/"/g, '')}"`)
        if (phone) filters.push(`phone = "${phone.replace(/"/g, '')}"`)
        lead = $app.findFirstRecordByFilter('Leads', filters.join(' || '))
      }
    } catch (_) {}

    if (lead) {
      if (
        body.event === 'PURCHASE_APPROVED' ||
        purchase.status === 'APPROVED' ||
        purchase.status === 'COMPLETE'
      ) {
        lead.set('etapa_pipeline', '8. Venda Realizada')
        $app.saveNoValidate(lead)
      }
      vendasRecord.set('lead_id', lead.id)
    }

    $app.saveNoValidate(vendasRecord)

    // CUSTOMER DATABASE SYNC
    const purchaseStatus = body.event || purchase.status || ''
    if (
      purchaseStatus === 'PURCHASE_APPROVED' ||
      purchase.status === 'APPROVED' ||
      purchase.status === 'COMPLETE'
    ) {
      let cliente = null
      try {
        const email = buyer.email || ''
        const phone = telefoneComprador || ''
        if (email || phone) {
          let filters = []
          if (email) filters.push(`email = "${email.replace(/"/g, '')}"`)
          if (phone) filters.push(`Telefone = "${phone.replace(/"/g, '')}"`)
          cliente = $app.findFirstRecordByFilter('bd_clientes', filters.join(' || '))
        } else {
          throw new Error('No contact info')
        }
      } catch (_) {
        const col = $app.findCollectionByNameOrId('bd_clientes')
        cliente = new Record(col)
      }
      cliente.set('Aluno_a', buyer.name || '')
      cliente.set('email', buyer.email || '')
      cliente.set('Telefone', telefoneComprador || '')
      cliente.set('Cidade', address.city || '')
      cliente.set('UF', address.state || '')
      cliente.set('CEP', address.zipcode || '')
      cliente.set('Nome_Prod', (data.product || {}).name || '')
      cliente.set('Tp_Pgto', payment.type || '')
      cliente.set('Vlr_Pago', fullPrice.value || 0)

      if (lead) {
        cliente.set('Vend_Resp_Lead', lead.id)
        const vendRespUser = lead.get('vend_resp')
        if (vendRespUser) cliente.set('Vend_Resp_User', vendRespUser)

        cliente.set('area_grad', lead.getString('area_grad'))
        cliente.set('concurso_alvo', lead.getString('concurso_alvo'))
        cliente.set('tmp_estudos', lead.getString('tmp_estudos'))
        cliente.set('hrs_est_dia', lead.getString('hrs_est_dia'))
        cliente.set('maior_dif', lead.getString('maior_dif'))
        cliente.set('top_obj', lead.getString('top_obj'))
      }
      $app.saveNoValidate(cliente)
    } else if (
      purchaseStatus === 'PURCHASE_CANCELED' ||
      purchaseStatus === 'PURCHASE_REFUNDED' ||
      purchase.status === 'CANCELED' ||
      purchase.status === 'REFUNDED'
    ) {
      try {
        const email = buyer.email || ''
        const phone = telefoneComprador || ''
        if (email || phone) {
          let filters = []
          if (email) filters.push(`email = "${email.replace(/"/g, '')}"`)
          if (phone) filters.push(`Telefone = "${phone.replace(/"/g, '')}"`)
          let cliente = $app.findFirstRecordByFilter('bd_clientes', filters.join(' || '))
          $app.delete(cliente)
        }
      } catch (_) {}
    }

    logStatus = 'success'
  } catch (err) {
    logStatus = 'error'
    $app.logger().error('Hotmart webhook processing error', 'error', String(err))
  }

  if (logId) {
    try {
      var logRec = $app.findRecordById('webhook_log', logId)
      logRec.set('status', logStatus)
      $app.saveNoValidate(logRec)
    } catch (_) {}
  }

  return e.json(200, { ok: true, status: logStatus })
})
