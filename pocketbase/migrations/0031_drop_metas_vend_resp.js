migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')
    col.fields.removeByName('vend_resp')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')
    col.fields.add(
      new RelationField({
        name: 'vend_resp',
        collectionId: app.findCollectionByNameOrId('Leads').id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(col)
  },
)
