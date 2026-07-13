routerAdd('POST', '/backend/v1/webhook_hotmart', (e) => {
  const body = e.requestInfo().body || {}

  const hottok =
    e.request.header.get('X-Hotmart-Hottok') || e.requestInfo().headers['x_hotmart_hottok'] || ''
  const expectedToken = $secrets.get('HOTTOK_HOTMART') || ''

  if (!expectedToken || hottok !== expectedToken) {
    return e.json(401, { error: 'Unauthorized' })
  }

  const payloadToLog = JSON.parse(JSON.stringify(body))
  delete payloadToLog.hottok
  delete payloadToLog['X-Hotmart-Hottok']

  let logStatus = 'received'
  let logId = ''

  try {
    const logCol = $app.findCollectionByNameOrId('webhook_log')
    const logRecord = new Record(logCol)
    logRecord.set('status', 'processing')
    logRecord.set('origem', 'hotmart')
    logRecord.set('payload_receb', payloadToLog)
    logRecord.set('data_receb', new Date().toISOString())
    $app.saveNoValidate(logRecord)
    logId = logRecord.id
  } catch (err) {
    $app.logger().error('Failed to create webhook_log', 'error', String(err))
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
    var vendasRecord = new Record(vendasCol)

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

    $app.saveNoValidate(vendasRecord)

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
