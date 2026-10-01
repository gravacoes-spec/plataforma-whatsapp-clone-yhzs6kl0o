// Hook de notificação por e-mail para novos cadastros de leads via /cadastro
onRecordCreate((e) => {
  try {
    var record = e.record
    var etapa = record.getString('etapa_pipeline')

    // Disparar apenas se o registro vier do formulário público (/cadastro),
    // identificado pela etapa inicial '1. Novo Lead'.
    if (etapa !== '1. Novo Lead') {
      return e.next()
    }

    var name = record.getString('name') || 'Não informado'
    var email = record.getString('email') || 'Não informado'
    var phone = record.getString('phone') || 'Não informado'
    var concursoAlvo = record.getString('concurso_alvo') || 'Não informado'

    var senderAddress = $app.settings().meta.senderAddress || 'no-reply@periciafoco.com.br'
    var senderName = $app.settings().meta.senderName || 'CRM Perícia Foco'

    var htmlBody =
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #27272a; border: 1px solid #e4e4e7; rounded: 8px;">' +
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
      to: [{ address: 'periciaafoco@gmail.com' }],
      subject: 'Novo lead via site — CRM Perícia Foco',
      html: htmlBody,
    })

    try {
      $app.newMailClient().send(message)
    } catch (mailErr) {
      $app
        .logger()
        .error(
          'on_lead_cadastro_notify: falha ao enviar e-mail de aviso do lead',
          'lead_id',
          record.id,
          'error',
          String(mailErr),
        )
    }
  } catch (err) {
    $app
      .logger()
      .error('on_lead_cadastro_notify: erro geral no hook de notificação', 'error', String(err))
  }

  return e.next()
}, 'Leads')
