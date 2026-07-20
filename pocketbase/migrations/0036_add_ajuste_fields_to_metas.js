migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')
    if (!col.fields.getByName('ajuste_leads')) {
      col.fields.add(new NumberField({ name: 'ajuste_leads' }))
    }
    if (!col.fields.getByName('ajuste_abordagens')) {
      col.fields.add(new NumberField({ name: 'ajuste_abordagens' }))
    }
    if (!col.fields.getByName('ajuste_consultorias')) {
      col.fields.add(new NumberField({ name: 'ajuste_consultorias' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')
    try {
      col.fields.removeByName('ajuste_leads')
    } catch (_) {}
    try {
      col.fields.removeByName('ajuste_abordagens')
    } catch (_) {}
    try {
      col.fields.removeByName('ajuste_consultorias')
    } catch (_) {}
    app.save(col)
  },
)
