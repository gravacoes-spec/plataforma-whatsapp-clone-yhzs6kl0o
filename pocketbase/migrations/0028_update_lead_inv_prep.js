migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')

    col.fields.removeByName('inv_prep')
    col.fields.add(
      new SelectField({
        name: 'inv_prep',
        values: ['Até R$ 500', 'R$ 500-1000', '+ R$ 1000'],
        maxSelect: 1,
        required: false,
      }),
    )
    app.save(col)

    try {
      app
        .db()
        .newQuery("UPDATE Leads SET inv_prep = 'Até R$ 500' WHERE inv_prep = 'Baixo'")
        .execute()
      app
        .db()
        .newQuery("UPDATE Leads SET inv_prep = 'R$ 500-1000' WHERE inv_prep = 'Medio'")
        .execute()
      app.db().newQuery("UPDATE Leads SET inv_prep = '+ R$ 1000' WHERE inv_prep = 'Alto'").execute()
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')

    col.fields.removeByName('inv_prep')
    col.fields.add(
      new SelectField({
        name: 'inv_prep',
        values: ['Baixo', 'Medio', 'Alto'],
        maxSelect: 1,
        required: false,
      }),
    )
    app.save(col)
  },
)
