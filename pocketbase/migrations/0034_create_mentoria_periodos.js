migrate(
  (app) => {
    const col = new Collection({
      name: 'mentoria_periodos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'client_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('bd_clientes').id,
          required: true,
          maxSelect: 1,
        },
        { name: 'start_date', type: 'date' },
        { name: 'end_date', type: 'date' },
        { name: 'renewal_info', type: 'text' },
        { name: 'mentor_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_mentoria_client ON mentoria_periodos (client_id)'],
    })
    app.save(col)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('mentoria_periodos'))
    } catch (_) {}
  },
)
