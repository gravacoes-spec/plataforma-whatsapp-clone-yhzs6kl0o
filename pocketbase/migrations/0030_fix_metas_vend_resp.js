migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')

    col.fields.removeByName('vend_resp')
    col.fields.add(
      new RelationField({
        name: 'vend_resp',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')

    col.fields.removeByName('vend_resp')
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
