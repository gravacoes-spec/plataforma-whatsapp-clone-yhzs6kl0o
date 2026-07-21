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

    // Identifica o delimitador automaticamente
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
      var d = new Date(str)
      if (!isNaN(d.getTime())) return d.toISOString()
      var parts = str.split(/[\/\s:]/)
      if (parts.length >= 3) {
        var day = parseInt(parts[0], 10)
        var month = parseInt(parts[1], 10) - 1
        var year = parseInt(parts[2], 10)
        var hour = parts.length > 3 ? parseInt(parts[3], 10) : 0
        var min = parts.length > 4 ? parseInt(parts[4], 10) : 0
        d = new Date(year, month, day, hour, min)
        if (!isNaN(d.getTime())) return d.toISOString()
      }
      return ''
    }

    var normalizePhone = function (phone) {
      if (!phone) return ''
      return String(phone).replace(/\D/g, '')
    }

    var headers = parseCSVLine(lines[0], delimiter)
    for (var h = 0; h < headers.length; h++) {
      headers[h] = headers[h].trim()
    }

    // Função para remover acentos e facilitar a busca independente do que a Hotmart enviar
    var removeAccents = function (str) {
      return str
        .replace(/[áàãâä]/gi, 'a')
        .replace(/[éèêë]/gi, 'e')
        .replace(/[íìîï]/gi, 'i')
        .replace(/[óòõôö]/gi, 'o')
        .replace(/[úùûü]/gi, 'u')
        .replace(/[ç]/gi, 'c')
    }

    // Nova função de mapeamento de colunas que ignora acentos, espaços extras e letras maiúsculas/minúsculas
    var getVal = function (row, aliases) {
      if (!Array.isArray(aliases)) aliases = [aliases]
      for (var a = 0; a < aliases.length; a++) {
        var aliasNorm = removeAccents(aliases[a].toLowerCase().trim())
        var idx = -1
        for (var h = 0; h < headers.length; h++) {
          var headerNorm = removeAccents(headers[h].toLowerCase().trim())
          if (headerNorm === aliasNorm) {
            idx = h
            break
          }
        }
        if (idx !== -1) return (row[idx] || '').trim()
      }
      return ''
    }

    var vendasCol = $app.findCollectionByNameOrId('vendas_hotmart')
    var clientesCol = $app.findCollectionByNameOrId('bd_clientes')
    var leadsCol = $app.findCollectionByNameOrId('Leads')

    var imported = 0
    var errors = 0
    var clientesSynced = 0

    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      var row = parseCSVLine(lines[i], delimiter)

      // Adicionados nomes das colunas exatamente como a Hotmart costuma enviar nas planilhas recentes
      var nomeProduto = getVal(row, ['Nome do Produto', 'Produto', 'Product Name'])
      var transacao = getVal(row, ['Código da transação', 'Transação', 'Venda', 'Transaction'])
      var meioPagamento = getVal(row, ['Meio de pagamento', 'Forma de Pagamento', 'Payment Method'])
      var moeda = getVal(row, ['Moeda', 'Currency'])
      var precoTotal = parseBrazilianNumber(
        getVal(row, ['Preço', 'Valor', 'Preço Total', 'Preço da Oferta']),
      )
      var status = getVal(row, ['Status da transação', 'Status', 'Status da Compra'])
      var dataVenda = parseDate(
        getVal(row, [
          'Data de Venda',
          'Data da Venda',
          'Data do Pedido',
          'Data',
          'Data de confirmação',
        ]),
      )
      var nome = getVal(row, ['Nome do Comprador', 'Nome', 'Comprador', 'Buyer Name'])
      var email = getVal(row, ['Email do Comprador', 'Email', 'E-mail'])
      var documento = getVal(row, [
        'Documento do Comprador',
        'Documento',
        'CPF',
        'CNPJ',
        'CPF/CNPJ',
      ])
      var telefone = normalizePhone(
        getVal(row, ['Telefone do Comprador', 'Telefone', 'Telefone de Contato', 'Celular']),
      )
      var cep = getVal(row, ['CEP', 'Código Postal', 'Zip Code'])
      var cidade = getVal(row, ['Cidade', 'City'])
      var estado = getVal(row, ['Estado', 'UF', 'State'])

      try {
        var vendasRecord = null
        if (transacao) {
          try {
            vendasRecord = $app.findFirstRecordByData('vendas_hotmart', 'transacao', transacao)
          } catch (_) {}
        }
        if (!vendasRecord) {
          vendasRecord = new Record(vendasCol)
        }

        vendasRecord.set('nome_produto', nomeProduto)
        vendasRecord.set('transacao', transacao)
        vendasRecord.set('meio_pagamento', meioPagamento)
        vendasRecord.set('moeda', moeda)
        vendasRecord.set('preco_total', precoTotal)
        vendasRecord.set('status_compra', status)
        vendasRecord.set('data_pedido', dataVenda)
        vendasRecord.set('nome_comprador', nome)
        vendasRecord.set('email_comprador', email)
        vendasRecord.set('telefone_comprador', telefone)
        vendasRecord.set('documento_comprador', documento)
        vendasRecord.set('cidade_comprador', cidade)
        vendasRecord.set('estado_comprador', estado)

        // Regra que você pediu: tipo_evento espelhando o "Status da transação" (ou "IMPORTED" se vazio)
        vendasRecord.set('tipo_evento', status || 'IMPORTED')
        vendasRecord.set('parcelas', 0)

        var lead = null
        if (email || telefone) {
          var filters = []
          if (email) filters.push('email = "' + email.replace(/"/g, '') + '"')
          if (telefone) filters.push('phone = "' + telefone.replace(/"/g, '') + '"')
          try {
            lead = $app.findFirstRecordByFilter('Leads', filters.join(' || '))
          } catch (_) {}
        }

        // Verifica o status ignorando letras minúsculas para não gerar erro
        var statusCheck = (status || '').toUpperCase()

        if (!lead && (email || telefone)) {
          lead = new Record(leadsCol)
          lead.set('name', nome)
          lead.set('email', email)
          lead.set('phone', telefone)
          lead.set('etapa_pipeline', '8. Venda Realizada')
          $app.saveNoValidate(lead)
        } else if (
          lead &&
          (statusCheck === 'APPROVED' ||
            statusCheck === 'COMPLETE' ||
            statusCheck === 'APROVADA' ||
            statusCheck === 'COMPLETA')
        ) {
          lead.set('etapa_pipeline', '8. Venda Realizada')
          $app.saveNoValidate(lead)
        }

        if (lead) {
          vendasRecord.set('lead_id', lead.id)
        }

        $app.saveNoValidate(vendasRecord)
        imported++

        if (
          statusCheck === 'APPROVED' ||
          statusCheck === 'COMPLETE' ||
          statusCheck === 'APROVADA' ||
          statusCheck === 'COMPLETA'
        ) {
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
          cliente.set('CEP', cep)
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

    return e.json(200, {
      ok: true,
      imported: imported,
      errors: errors,
      clientesSynced: clientesSynced,
    })
  },
  $apis.requireAuth(),
)
