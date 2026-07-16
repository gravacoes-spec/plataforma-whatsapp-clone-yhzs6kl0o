migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')
    if (!col.fields.getByName('pending_interaction')) {
      col.fields.add(new BoolField({ name: 'pending_interaction' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')
    if (col.fields.getByName('pending_interaction')) {
      col.fields.removeByName('pending_interaction')
      app.save(col)
    }
  },
)
