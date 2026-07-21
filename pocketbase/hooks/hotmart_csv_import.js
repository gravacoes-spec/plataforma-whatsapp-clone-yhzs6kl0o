routerAdd(
  'POST',
  '/backend/v1/hotmart/import-csv',
  (e) => {
    const body = e.requestInfo().body || {}
    var csvText = body.csv || ''

    if (!csvText.trim()) {
      return e.badRequestError('CSV content is required')
    }

    if (csvText.charCodeAt(0) === 0xfeff) {
      csvText = csvText.slice(1)
    }

    var lines = csvText.split(/\r?\n/)
    if (lines.length < 2) {
      return e.badRequestError('CSV must have a header row and at least one data row')
    }

    var delimiter = lines[0].indexOf(';') > -1 ? ';' : ','

    var parseCSVLine = function (line, delim) {
      var result = []
      var current = ''
      var inQuotes = false
      for (var i = 0; i < line.length; i++) {
        var char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === delim && !inQuotes) {
          result.push(current)
          current = ''
        } else {
          current += char
        }
      }
      result.push(current)
      return result
    }

    var parseBrazilianNumber = function (str) {
      if (!str) return 0
      str = String(str).replace(/[R$\s]/g, '')
      if (str.indexOf('.') > -1 && str.indexOf(',') > -1) {
        str = str.replace(/\./g, '').replace(',', '.')
      } else if (str.indexOf(',') > -1) {
        str = str.replace(',', '.')
      }
      var num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }

    var parseDate = function (str) {
      if (!str) return ''

      var parts = str.trim().split(/[\/\s:]+/)

      if (parts.length >= 3) {
        var pad = function (n) {
          return String(n).length < 2 ? '0' + String(n) : String(n)
        }
        var day = pad(parts[0])
        var month = pad(parts[1])
        var year = parts[2]
        var hour = parts.length > 3 ? pad(parts[3]) : '00'
        var min = parts.length > 4 ? pad(parts[4]) : '00'
        var sec = parts.length > 5 ? pad(parts[5]) : '00'

        return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec + '-03:00'
      }

      var d = new Date(str)
      if (!isNaN(d.getTime())) return d.toISOString()

      return ''
    }

    var normalizePhone = function (phone) {
      if (!phone) return ''
      return String(phone).replace(/\D/g, '')
    }

    var headers = parseCSVLine(lines[0], delimiter)
    for (var h = 0; h < headers.length; h++) {
      headers[h] = headers[h].replace(/^[\uFEFF\u200B]/, '').trim()
    }

    var getVal = function (row, aliases) {
      if (!Array.isArray(aliases)) aliases = [aliases]
      for (var a = 0; a < aliases.length; a++) {
        var aliasNorm = aliases[a].toLowerCase().trim()
        var idx = -1
        for (var h = 0; h < headers.length; h++) {
          var headerNorm = headers[h].toLowerCase().trim()
          if (headerNorm === aliasNorm) {
            idx = h
            break
          }
        }
        if (idx !== -1) return (row[idx] || '').trim()
      }
      return ''
    }

    var vendasCol, clientesCol, leadsCol
    try {
      vendasCol = $app.findCollectionByNameOrId('vendas_hotmart')
      clientesCol = $app.findCollectionByNameOrId('bd_clientes')
      leadsCol = $app.findCollectionByNameOrId('Leads')
    } catch (colErr) {
      return e.json(500, { ok: false, error: 'Collection lookup failed: ' + String(colErr) })
    }

    var imported = 0
    var errors = 0
    var clientesSynced = 0

    try {
    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      var row = parseCSVLine(lines[i], delimiter)

      var transacao = getVal(row, ['Código da transação'])
      var status = getVal(row, ['Status da transação'])
      var dataVenda = parseDate(getVal(row, ['Data da transação']))
      var nomeProduto = getVal(row, ['Produto'])
      var nome = getVal(row, ['Comprador(a)'])
      var email = getVal(row, ['Email do(a) Comprador(a)'])
      var telefone = normalizePhone(getVal(row, ['Telefone']))
      var documento = getVal(row, ['Documento'])
      var cidade = getVal(row, ['Cidade'])
      var estado = getVal(row, ['Estado / Província'])
      var meioPagamento = getVal(row, ['Método de pagamento'])

      var parcelasStr = getVal(row, ['Quantidade total de parcelas'])
      var parcelas = parseInt(parcelasStr, 10)
      if (isNaN(parcelas)) parcelas = 0

      var precoTotal = parseBrazilianNumber(getVal(row, ['Valor de compra com impostos']))
      var moeda = getVal(row, ['Moeda de compra'])
      var comissaoProdutor = parseBrazilianNumber(
        getVal(row, ['Faturamento líquido do(a) Produtor(a)']),
      )
      var nomeAfiliado = getVal(row, ['Nome do(a) Afiliado(a)'])
      var valorFrete = parseBrazilianNumber(getVal(row, ['Valor do frete bruto']))

      try {
        var vendasRecord = null
        var isNewVenda = false

        if (transacao) {
          try {
            vendasRecord = $app.findFirstRecordByData('vendas_hotmart', 'transacao', transacao)
          } catch (_) {}
        }

        if (!vendasRecord) {
          vendasRecord = new Record(vendasCol)
          isNewVenda = true // Marca que é uma venda nova para somar na tabela de Metas
        }

        vendasRecord.set('tipo_evento', 'IMPORTED')
        vendasRecord.set('transacao', transacao)
        vendasRecord.set('status_compra', status)
        vendasRecord.set('data_pedido', dataVenda)
        vendasRecord.set('nome_produto', nomeProduto)
        vendasRecord.set('nome_comprador', nome)
        vendasRecord.set('email_comprador', email)
        vendasRecord.set('telefone_comprador', telefone)
        vendasRecord.set('documento_comprador', documento)
        vendasRecord.set('cidade_comprador', cidade)
        vendasRecord.set('estado_comprador', estado)
        vendasRecord.set('meio_pagamento', meioPagamento)
        vendasRecord.set('parcelas', parcelas)
        vendasRecord.set('preco_total', precoTotal)
        vendasRecord.set('moeda', moeda)
        vendasRecord.set('comissao_produtor', comissaoProdutor)
        vendasRecord.set('nome_afiliado', nomeAfiliado)
        vendasRecord.set('valor_frete', valorFrete)

        var lead = null
        if (email || telefone) {
          var filters = []
          if (email) filters.push('email = "' + email.replace(/"/g, '') + '"')
          if (telefone) filters.push('phone = "' + telefone.replace(/"/g, '') + '"')
          try {
            lead = $app.findFirstRecordByFilter('Leads', filters.join(' || '))
          } catch (_) {}
        }

        var statusCheck = (status || '').toUpperCase()
        var isApproved =
          statusCheck === 'APPROVED' ||
          statusCheck === 'COMPLETE' ||
          statusCheck === 'APROVADA' ||
          statusCheck === 'COMPLETA'

        if (!lead && (email || telefone)) {
          lead = new Record(leadsCol)
          lead.set('name', nome)
          lead.set('email', email)
          lead.set('phone', telefone)
          lead.set('etapa_pipeline', '8. Venda Realizada')
          $app.saveNoValidate(lead)
        } else if (lead && isApproved) {
          lead.set('etapa_pipeline', '8. Venda Realizada')
          $app.saveNoValidate(lead)
        }

        if (lead) {
          vendasRecord.set('lead_id', lead.id)
        }

        $app.saveNoValidate(vendasRecord)
        imported++

        // ==========================================================
        // SINCRONIZAÇÃO COM A TABELA DE METAS (Cálculo do Dashboard)
        // ==========================================================
        if (lead && isNewVenda && isApproved) {
          var vRespId = lead.getString('vend_resp')

          if (vRespId) {
            var isVendedor = false
            try {
              var vUser = $app.findRecordById('users', vRespId)
              isVendedor = vUser.getString('perfil_acess') === 'Vendedor'
            } catch (_) {}

            if (isVendedor) {
              var nowStr = new Date().toISOString().replace('T', ' ')
              var metas = null

              try {
                var mRecs = $app.findRecordsByFilter(
                  'Metas',
                  'vend_resp = "' +
                    vRespId +
                    '" && periodo_in <= "' +
                    nowStr +
                    '" && periodo_fin >= "' +
                    nowStr +
                    '"',
                  '-created',
                  1,
                  0,
                )
                if (mRecs.length > 0) metas = mRecs[0]
              } catch (_) {}

              // Se não existir meta para o ano, cria uma vazia
              if (!metas) {
                try {
                  var mCol2 = $app.findCollectionByNameOrId('Metas')
                  metas = new Record(mCol2)
                  metas.set('vend_resp', vRespId)
                  metas.set(
                    'periodo_in',
                    new Date(new Date().getFullYear(), 0, 1).toISOString().replace('T', ' '),
                  )
                  metas.set(
                    'periodo_fin',
                    new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)
                      .toISOString()
                      .replace('T', ' '),
                  )
                  metas.set('r_vendas', 0)
                  metas.set('r_faturamento', 0)
                  metas.set('r_leads_recebidos', 0)
                  metas.set('r_abord_prospec_ativa', 0)
                  metas.set('r_apresent_consult', 0)
                  metas.set('m_leads_recebidos', 0)
                  metas.set('m_abord_prospec_ativa', 0)
                  metas.set('m_apresent_consult', 0)
                  metas.set('m_vendas', 0)
                  metas.set('m_faturamento', 0)
                } catch (_) {}
              }

              // Soma +1 venda e adiciona o faturamento da venda importada
              if (metas) {
                metas.set('r_vendas', (metas.getInt('r_vendas') || 0) + 1)
                metas.set('r_faturamento', (metas.getFloat('r_faturamento') || 0) + precoTotal)
                $app.saveNoValidate(metas)
              }
            }
          }
        }
        // ==========================================================

        if (isApproved) {
          var cliente = null
          if (email || telefone) {
            var cFilters = []
            if (email) cFilters.push('email = "' + email.replace(/"/g, '') + '"')
            if (telefone) cFilters.push('Telefone = "' + telefone.replace(/"/g, '') + '"')
            try {
              cliente = $app.findFirstRecordByFilter('bd_clientes', cFilters.join(' || '))
            } catch (_) {}
          }

          if (!cliente) {
            cliente = new Record(clientesCol)
          }

          cliente.set('Aluno_a', nome)
          cliente.set('email', email)
          cliente.set('Telefone', telefone)
          cliente.set('Cidade', cidade)
          cliente.set('UF', estado)
          cliente.set('CEP', getVal(row, ['Código postal']))
          cliente.set('Nome_Prod', nomeProduto)
          cliente.set('Tp_Pgto', meioPagamento)
          cliente.set('Vlr_Pago', precoTotal)

          if (lead) {
            cliente.set('Vend_Resp_Lead', lead.id)
            var vendRespUser = lead.getString('vend_resp')
            if (vendRespUser) cliente.set('Vend_Resp_User', vendRespUser)
            cliente.set('area_grad', lead.getString('area_grad'))
            cliente.set('concurso_alvo', lead.getString('concurso_alvo'))
            cliente.set('tmp_estudos', lead.getString('tmp_estudos'))
            cliente.set('hrs_est_dia', lead.getString('hrs_est_dia'))
            cliente.set('maior_dif', lead.getString('maior_dif'))
            cliente.set('top_obj', lead.getString('top_obj'))
          }

          $app.saveNoValidate(cliente)
          clientesSynced++
        }
      } catch (rowErr) {
        errors++
        $app.logger().error('CSV import row error', 'row', i, 'error', String(rowErr))
      }
    }

    var result = { ok: true, imported: imported, errors: errors, clientesSynced: clientesSynced }
    return e.json(200, result)
  } catch (fatalErr) {
    $app.logger().error('CSV import fatal error', 'error', String(fatalErr))
    return e.json(500, {
      ok: false,
      error: 'Import failed: ' + String(fatalErr),
      imported: typeof imported !== 'undefined' ? imported : 0,
      errors: typeof errors !== 'undefined' ? errors : 0,
      clientesSynced: typeof clientesSynced !== 'undefined' ? clientesSynced : 0,
    })
  },
  $apis.requireAuth(),
)
