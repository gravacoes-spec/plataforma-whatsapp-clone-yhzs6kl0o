migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')
    if (!col.fields.getByName('origem')) {
      col.fields.add(
        new TextField({
          name: 'origem',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('Leads')
      if (col.fields.getByName('origem')) {
        col.fields.removeByName('origem')
        app.save(col)
      }
    } catch (_) {}
  },
)
