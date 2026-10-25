// Hook de notificação por e-mail para novos cadastros de leads via /cadastro
onRecordAfterCreateRequest((e) => {
  try {
    var record = e.record
    var etapa = record.getString('etapa_pipeline')

    // 1. Forma mais robusta de capturar o Referer
    var referer = ''
    try {
      referer =
        e.httpContext && e.httpContext.request()
          ? e.httpContext.request().header.get('Referer') || ''
          : ''
    } catch (err) {}

    // 2. Verifica se a requisição foi feita por um usuário logado internamente
    var authRecord = e.httpContext ? e.httpContext.get('authRecord') : null

    // === LOG DE RASTREAMENTO (Veja no menu 'Logs' do PocketBase) ===
    $app
      .logger()
      .info('Avaliando disparo de Lead', 'etapa', etapa, 'referer', referer, 'logado', !!authRecord)

    // 3. Validação: A etapa deve ser "1. Novo Lead"
    if (etapa !== '1. Novo Lead') {
      return e.next()
    }

    // 4. Validação: Se houver usuário logado (ex: você testando sem ser aba anônima), ignora!
    if (authRecord) {
      $app
        .logger()
        .info('Email abortado: Usuário logado detectado. Para testar, use uma guia anônima.')
      return e.next()
    }

    // 5. Validação: Flexibilizada para lidar com navegadores que ocultam o "/cadastro"
    // Validamos apenas se a requisição se originou do ecossistema do seu CRM
    if (!referer.includes('crm-pericia-foco')) {
      $app.logger().info('Email abortado: Origem não reconhecida no referer.')
      return e.next()
    }

    // Se chegou até aqui, todas as regras foram cumpridas!
    var name = record.getString('name') || 'Não informado'
    var email = record.getString('email') || 'Não informado'
    var phone = record.getString('phone') || 'Não informado'
    var concursoAlvo = record.getString('concurso_alvo') || 'Não informado'

    var senderAddress = $app.settings().meta.senderAddress || 'no-reply@periciafoco.com.br'
    var senderName = $app.settings().meta.senderName || 'CRM Perícia Foco'

    var htmlBody =
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #27272a; border: 1px solid #e4e4e7; border-radius: 8px;">' +
      '<h2 style="color: #18181b; margin-top: 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Novo Lead Cadastrado via Site</h2>' +
      '<p style="font-size: 14px; color: #52525b;">Um novo formulário de consultoria de estudos (/cadastro) foi preenchido.</p>' +
      '<table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">' +
      '<tr><td style="padding: 8px; font-weight: bold; width: 140px; border-bottom: 1px solid #f4f4f5;">Nome:</td><td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">' +
      name +
      '</td></tr>' +
      '<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f4f4f5;">E-mail:</td><td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">' +
      email +
      '</td></tr>' +
      '<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Telefone:</td><td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">' +
      phone +
      '</td></tr>' +
      '<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Concurso Alvo:</td><td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">' +
      concursoAlvo +
      '</td></tr>' +
      '</table>' +
      '<p style="font-size: 12px; color: #71717a; margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 12px;">Notificação gerada automaticamente pelo CRM Perícia Foco.</p>' +
      '</div>'

    var message = new MailerMessage({
      from: {
        address: senderAddress,
        name: senderName,
      },
      to: [{ address: 'renan.indap@gmail.com' }], // E-mail temporário para testes
      subject: 'Novo lead via site — CRM Perícia Foco',
      html: htmlBody,
    })

    try {
      $app.newMailClient().send(message)
      $app.logger().info('E-mail enviado com sucesso para o novo lead: ' + email)
    } catch (mailErr) {
      $app
        .logger()
        .error(
          'Falha ao enviar e-mail de aviso do lead',
          'lead_id',
          record.id,
          'error',
          String(mailErr),
        )
    }
  } catch (err) {
    $app.logger().error('Erro geral no hook de notificação', 'error', String(err))
  }

  return e.next()
}, 'Leads')
