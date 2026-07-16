migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.addIndex('idx_users_perfil', false, 'perfil_acess', '')
    app.save(usersCol)

    const vendasCol = app.findCollectionByNameOrId('vendas_hotmart')
    vendasCol.addIndex('idx_vh_status', false, 'status_compra', '')
    app.save(vendasCol)
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.removeIndex('idx_users_perfil')
    app.save(usersCol)

    const vendasCol = app.findCollectionByNameOrId('vendas_hotmart')
    vendasCol.removeIndex('idx_vh_status')
    app.save(vendasCol)
  },
)
