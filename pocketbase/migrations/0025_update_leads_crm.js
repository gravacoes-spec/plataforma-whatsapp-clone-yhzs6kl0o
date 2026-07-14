migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')

    if (!col.fields.getByName('tags')) {
      col.fields.add(new TextField({ name: 'tags' }))
    }

    if (!col.fields.getByName('mentoria')) {
      col.fields.add(new BoolField({ name: 'mentoria' }))
    }

    const motivoField = col.fields.getByName('motivo_perda')
    if (motivoField) {
      col.fields.removeByName('motivo_perda')
      col.fields.add(
        new SelectField({
          name: 'motivo_perda',
          values: [
            'Orçamento insuficiente',
            'O produto não se encaixa à necessidade',
            'Não satisfeito com as condições de pagamento',
            'Comprado do concorrente',
            'Lead desqualificado (não quer se dedicar/não tem graduação específica)',
            'Lead não retornou o(s) contato(s)',
          ],
          maxSelect: 1,
        }),
      )
    }

    const etapaField = col.fields.getByName('etapa_pipeline')
    if (etapaField) {
      col.fields.removeByName('etapa_pipeline')
      col.fields.add(
        new SelectField({
          name: 'etapa_pipeline',
          values: [
            '1. Novo Lead',
            '2. Abordagem',
            '3. Lead Premium',
            '4. Lead Qualificado',
            '5. Lead em Nutrição',
            '6. Agendamento de Consultoria',
            '7. Negociação',
            '8. Venda Realizada',
            '9. Follow-up',
            '10. Lead Desqualificado/Perda',
          ],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)

    try {
      app
        .db()
        .newQuery(
          "UPDATE Leads SET etapa_pipeline = '1. Novo Lead' WHERE etapa_pipeline = 'Novo' OR etapa_pipeline = 'Triagem / Qualificação'",
        )
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE Leads SET etapa_pipeline = '2. Abordagem' WHERE etapa_pipeline = 'Contatado'",
        )
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE Leads SET etapa_pipeline = '6. Agendamento de Consultoria' WHERE etapa_pipeline = 'Apresentacao'",
        )
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE Leads SET etapa_pipeline = '7. Negociação' WHERE etapa_pipeline = 'Negociacao'",
        )
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE Leads SET etapa_pipeline = '8. Venda Realizada' WHERE etapa_pipeline = 'Ganho'",
        )
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE Leads SET etapa_pipeline = '10. Lead Desqualificado/Perda' WHERE etapa_pipeline = 'Perdido'",
        )
        .execute()
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('Leads')
    try {
      col.fields.removeByName('tags')
    } catch (_) {}
    try {
      col.fields.removeByName('mentoria')
    } catch (_) {}
    app.save(col)
  },
)
