migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')

    col.fields.removeByName('tp_tarefa')
    col.fields.add(
      new SelectField({
        name: 'tp_tarefa',
        values: ['Reunião/Consultoria', 'Follow-up', 'Mentoria', 'E-mail', 'Outra'],
        maxSelect: 1,
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')

    col.fields.removeByName('tp_tarefa')
    col.fields.add(
      new SelectField({
        name: 'tp_tarefa',
        values: ['Reunião/Consultoria', 'Follow-up', 'Mentoria', 'Outra'],
        maxSelect: 1,
      }),
    )

    app.save(col)
  },
)
