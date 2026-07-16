onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('direction') !== 'out') return e.next()

  try {
    const contactId = e.record.getString('contact_id')
    const msgs = $app.findRecordsByFilter(
      'whatsapp_messages',
      `contact_id = "${contactId}" && direction = "out"`,
      '',
      2,
      0,
    )

    if (msgs.length > 1) return e.next()

    const contact = $app.findRecordById('whatsapp_contacts', contactId)
    let phone = contact.getString('remote_jid').split('@')[0]
    if (phone.length > 12 && phone.startsWith('55')) {
      phone = phone.substring(2)
    }

    let lead
    try {
      lead = $app.findFirstRecordByFilter('Leads', `phone ~ "${phone}"`)
    } catch (_) {
      return e.next()
    }

    const vendResp = lead.getString('vend_resp')
    if (!vendResp) return e.next()

    const nowStr = new Date().toISOString().replace('T', ' ')
    let metas
    try {
      const recs = $app.findRecordsByFilter(
        'Metas',
        `vend_resp = "${vendResp}" && periodo_in <= "${nowStr}" && periodo_fin >= "${nowStr}"`,
        '-created',
        1,
        0,
      )
      if (recs.length > 0) metas = recs[0]
    } catch (_) {}

    if (metas) {
      metas.set('r_abord_prospec_ativa', (metas.getInt('r_abord_prospec_ativa') || 0) + 1)
      $app.saveNoValidate(metas)
    }
  } catch (err) {
    $app.logger().error('Failed to update r_abord_prospec_ativa', 'error', String(err))
  }

  return e.next()
}, 'whatsapp_messages')
