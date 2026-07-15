migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vendas_hotmart')
    if (!col.fields.getByName('lead_id')) {
      col.fields.add(
        new RelationField({
          name: 'lead_id',
          collectionId: app.findCollectionByNameOrId('Leads').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vendas_hotmart')
    if (col.fields.getByName('lead_id')) {
      col.fields.removeByName('lead_id')
      app.save(col)
    }
  },
)
