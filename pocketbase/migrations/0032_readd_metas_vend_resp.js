migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')
    col.fields.add(
      new RelationField({
        name: 'vend_resp',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(col)

    try {
      app
        .db()
        .newQuery(`
      UPDATE \`Metas\` 
      SET vend_resp = vend_resp_tmp
      WHERE vend_resp_tmp IS NOT NULL AND vend_resp_tmp != ''
    `)
        .execute()
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Metas')
    col.fields.removeByName('vend_resp')
    app.save(col)
  },
)
