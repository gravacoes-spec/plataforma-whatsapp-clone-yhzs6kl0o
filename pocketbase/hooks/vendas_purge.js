routerAdd(
  'POST',
  '/backend/v1/vendas-hotmart/purge',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')

    const perfil = auth.getString('perfil_acess')
    if (perfil !== 'Gestor') {
      return e.forbiddenError('Only Gestor can purge sales data')
    }

    try {
      const col = $app.findCollectionByNameOrId('vendas_hotmart')
      $app.truncateCollection(col)
      return e.json(200, { ok: true, purged: true })
    } catch (err) {
      $app.logger().error('vendas_hotmart purge failed', 'error', String(err))
      return e.json(500, { ok: false, error: 'Purge failed' })
    }
  },
  $apis.requireAuth(),
)
