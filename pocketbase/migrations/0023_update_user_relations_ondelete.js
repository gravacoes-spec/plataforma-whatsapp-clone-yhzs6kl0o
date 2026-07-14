migrate(
  (app) => {
    const usersId = '_pb_users_auth_'

    const cascadeItems = [
      { collection: 'whatsapp_instances', field: 'user_id', required: true },
      { collection: 'whatsapp_contacts', field: 'user_id', required: true },
      { collection: 'whatsapp_messages', field: 'user_id', required: true },
      { collection: 'ai_agents', field: 'user_id', required: true },
      { collection: 'tasks', field: 'user_id', required: false },
    ]

    for (const item of cascadeItems) {
      const col = app.findCollectionByNameOrId(item.collection)
      const existing = col.fields.getByName(item.field)
      if (existing) {
        col.fields.removeByName(item.field)
      }
      col.fields.add(
        new RelationField({
          name: item.field,
          required: item.required,
          collectionId: usersId,
          onDelete: 'cascade',
          maxSelect: 1,
        }),
      )
      app.save(col)
    }

    const setNullItems = [
      { collection: 'Leads', field: 'vend_resp' },
      { collection: 'bd_clientes', field: 'Mentor_a' },
      { collection: 'bd_clientes', field: 'Vend_Resp_User' },
    ]

    for (const item of setNullItems) {
      const col = app.findCollectionByNameOrId(item.collection)
      const existing = col.fields.getByName(item.field)
      if (existing) {
        col.fields.removeByName(item.field)
      }
      col.fields.add(
        new RelationField({
          name: item.field,
          collectionId: usersId,
          onDelete: 'null',
          maxSelect: 1,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const allItems = [
      { collection: 'whatsapp_instances', field: 'user_id', required: true },
      { collection: 'whatsapp_contacts', field: 'user_id', required: true },
      { collection: 'whatsapp_messages', field: 'user_id', required: true },
      { collection: 'ai_agents', field: 'user_id', required: true },
      { collection: 'tasks', field: 'user_id', required: false },
      { collection: 'Leads', field: 'vend_resp', required: false },
      { collection: 'bd_clientes', field: 'Mentor_a', required: false },
      { collection: 'bd_clientes', field: 'Vend_Resp_User', required: false },
    ]

    for (const item of allItems) {
      try {
        const col = app.findCollectionByNameOrId(item.collection)
        const existing = col.fields.getByName(item.field)
        if (existing) {
          col.fields.removeByName(item.field)
        }
        col.fields.add(
          new RelationField({
            name: item.field,
            required: item.required,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          }),
        )
        app.save(col)
      } catch (_) {}
    }
  },
)
