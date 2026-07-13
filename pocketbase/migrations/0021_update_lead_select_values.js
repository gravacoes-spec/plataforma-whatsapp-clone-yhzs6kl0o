migrate(
  (app) => {
    var oldData = []
    try {
      var records = app.findRecordsByFilter('Leads', 'id != ""', '-created', 500, 0)
      for (var i = 0; i < records.length; i++) {
        var r = records[i]
        oldData.push({
          id: r.id,
          int_perito: r.getString('int_perito'),
          tmp_acad: r.getString('tmp_acad'),
          renda: r.getString('renda'),
          etapa_pipeline: r.getString('etapa_pipeline'),
        })
      }
    } catch (_) {}

    var col = app.findCollectionByNameOrId('Leads')

    col.fields.removeByName('int_perito')
    col.fields.add(
      new SelectField({
        name: 'int_perito',
        values: ['100% decidido', 'Ainda avaliando'],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('tmp_acad')
    col.fields.add(
      new SelectField({
        name: 'tmp_acad',
        values: [
          'Formado ou últimos 3 anos',
          'Primeiros anos da graduação',
          'Sem graduação aderente',
        ],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('renda')
    col.fields.add(
      new SelectField({
        name: 'renda',
        values: ['Possui renda própria', 'Sem renda própria'],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('etapa_pipeline')
    col.fields.add(
      new SelectField({
        name: 'etapa_pipeline',
        values: [
          'Triagem / Qualificação',
          '3. Lead Premium',
          '4. Lead Qualificado',
          '5. Lead em Nutrição',
          'Novo',
          'Contatado',
          'Apresentacao',
          'Negociacao',
          'Ganho',
          'Perdido',
        ],
        maxSelect: 1,
      }),
    )

    app.save(col)

    for (var j = 0; j < oldData.length; j++) {
      try {
        var old = oldData[j]
        var rec = app.findRecordById('Leads', old.id)
        var changed = false

        if (old.int_perito === 'Sim') {
          rec.set('int_perito', '100% decidido')
          changed = true
        } else if (old.int_perito === 'Talvez' || old.int_perito === 'Nao') {
          rec.set('int_perito', 'Ainda avaliando')
          changed = true
        } else if (old.int_perito === '100% decidido' || old.int_perito === 'Ainda avaliando') {
          rec.set('int_perito', old.int_perito)
        }

        if (old.tmp_acad === 'Pos-Graduacao' || old.tmp_acad === 'Doutorado') {
          rec.set('tmp_acad', 'Formado ou últimos 3 anos')
          changed = true
        } else if (old.tmp_acad === 'Graduacao') {
          rec.set('tmp_acad', 'Primeiros anos da graduação')
          changed = true
        } else if (old.tmp_acad === 'Ensino Medio') {
          rec.set('tmp_acad', 'Sem graduação aderente')
          changed = true
        } else if (
          old.tmp_acad === 'Formado ou últimos 3 anos' ||
          old.tmp_acad === 'Primeiros anos da graduação' ||
          old.tmp_acad === 'Sem graduação aderente'
        ) {
          rec.set('tmp_acad', old.tmp_acad)
        }

        if (old.renda === '5k-10k' || old.renda === '10k+') {
          rec.set('renda', 'Possui renda própria')
          changed = true
        } else if (old.renda === 'Ate 2k' || old.renda === '2k-5k') {
          rec.set('renda', 'Sem renda própria')
          changed = true
        } else if (old.renda === 'Possui renda própria' || old.renda === 'Sem renda própria') {
          rec.set('renda', old.renda)
        }

        if (
          old.etapa_pipeline === 'Qualificado' ||
          old.etapa_pipeline === 'Novo' ||
          old.etapa_pipeline === 'Contatado'
        ) {
          rec.set('etapa_pipeline', 'Triagem / Qualificação')
          changed = true
        } else if (
          old.etapa_pipeline === 'Triagem / Qualificação' ||
          old.etapa_pipeline === '3. Lead Premium' ||
          old.etapa_pipeline === '4. Lead Qualificado' ||
          old.etapa_pipeline === '5. Lead em Nutrição' ||
          old.etapa_pipeline === 'Apresentacao' ||
          old.etapa_pipeline === 'Negociacao' ||
          old.etapa_pipeline === 'Ganho' ||
          old.etapa_pipeline === 'Perdido'
        ) {
          rec.set('etapa_pipeline', old.etapa_pipeline)
        }

        if (changed) {
          app.saveNoValidate(rec)
        }
      } catch (_) {}
    }
  },
  (app) => {
    var col = app.findCollectionByNameOrId('Leads')

    col.fields.removeByName('int_perito')
    col.fields.add(
      new SelectField({
        name: 'int_perito',
        values: ['Sim', 'Nao', 'Talvez'],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('tmp_acad')
    col.fields.add(
      new SelectField({
        name: 'tmp_acad',
        values: ['Ensino Medio', 'Graduacao', 'Pos-Graduacao', 'Doutorado'],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('renda')
    col.fields.add(
      new SelectField({
        name: 'renda',
        values: ['Ate 2k', '2k-5k', '5k-10k', '10k+'],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('etapa_pipeline')
    col.fields.add(
      new SelectField({
        name: 'etapa_pipeline',
        values: [
          'Novo',
          'Contatado',
          'Qualificado',
          'Apresentacao',
          'Negociacao',
          'Ganho',
          'Perdido',
        ],
        maxSelect: 1,
      }),
    )

    app.save(col)
  },
)
