onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('perfil_acess') === 'Mentor(a)') {
    try {
      var mentorCol = $app.findCollectionByNameOrId('bd_mentor')
      var mentor
      try {
        mentor = $app.findFirstRecordByData('bd_mentor', 'email', e.record.getString('email'))
      } catch (_) {
        mentor = new Record(mentorCol)
      }
      mentor.set('nome', e.record.getString('name'))
      mentor.set('email', e.record.getString('email'))
      mentor.set('ativo', true)
      $app.saveNoValidate(mentor)
    } catch (err) {
      $app.logger().error('Failed to create bd_mentor on user create', 'error', String(err))
    }
  }
  return e.next()
}, 'users')
