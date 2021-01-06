export default [
  ['carousel', {multiple: true}, ['carousel', 'carousel-item']],
  ['form', {multiple: true}, ['form', 'form-item']],
  ['grid', {multiple: true}, ['row', 'col']],
  ['input', {useForm: true}, []],
  ['menu', {multiple: true}, ['menu', 'menu-item', 'submenu']],
  ['message|global:$message'],
  [
    'message-box|global:$msgbox',
    [
      'alert|global:$alert',
      'confirm|global:$confirm',
      'prompt|global:$prompt'
    ]
  ],
  ['select', {useForm: true, multiple: true}, ['select', 'option']],
  ['tab', {multiple: true}, ['tabs', 'tab-pane']],
  ['radio', {useForm: true, multiple: true}, ['radio', 'radio-button', 'radio-group']],
  ['radio-button', {useForm: true, multiple: true}, ['radio-button', 'radio-group']],
  ['button', {multiple: true}, ['button', 'button-group']],
  ['breadcrumb', {multiple: true}, ['breadcrumb', 'breadcrumb-item']],
  ['carousel', {multiple: true}, ['carousel', 'icon']],
  ['collapse', {multiple: true}, ['collapse', 'collapse-item']]
]
