migrate(
  (app) => {
    try {
      const senderAddress = app.settings().meta.senderAddress || 'no-reply@periciafoco.com.br'
      const senderName = app.settings().meta.senderName || 'CRM Perícia Foco'

      const htmlBody =
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #27272a; border: 1px solid #e4e4e7; border-radius: 8px;">' +
        '<h2 style="color: #18181b; margin-top: 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">[TESTE] Novo Lead Cadastrado via Site</h2>' +
        '<p style="font-size: 14px; color: #52525b;">Este é um e-mail de teste para validação do hook de notificação de novos leads (/cadastro).</p>' +
        '<table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">' +
        '<tr><td style="padding: 8px; font-weight: bold; width: 140px; border-bottom: 1px solid #f4f4f5;">Nome:</td><td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">Lead Teste</td></tr>' +
        '<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f4f4f5;">E-mail:</td><td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">lead.teste@exemplo.com</td></tr>' +
        '<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Telefone:</td><td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">(11) 99999-0000</td></tr>' +
        '<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Concurso Alvo:</td><td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">Perito Criminal Oficial (Simulação de Teste)</td></tr>' +
        '</table>' +
        '<p style="font-size: 12px; color: #71717a; margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 12px;">Notificação gerada automaticamente pelo CRM Perícia Foco para validação.</p>' +
        '</div>'

      const message = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: [{ address: 'renan.indap@gmail.com' }],
        subject: '[TESTE] Novo lead via site — CRM Perícia Foco',
        html: htmlBody,
      })

      app.newMailClient().send(message)
      console.log('[Migration 0038] E-mail de teste enviado com sucesso para renan.indap@gmail.com')
    } catch (err) {
      console.log('[Migration 0038] Falha ao enviar e-mail de teste:', err)
    }
  },
  (app) => {},
)
