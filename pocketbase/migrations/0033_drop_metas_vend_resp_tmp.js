migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')
    col.fields.removeByName('vend_resp_tmp')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')
    col.fields.add(
      new RelationField({
        name: 'vend_resp_tmp',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(col)
  },
)
