/**
 * Init filterer
 * @param {node} form - Optional form name to scope event listeners to.
 * @param {string} selector - CSS Selector that targets the items that you want to show or hide based on the . Doesn't have to be a table row, any element will do. Example: `#mytable tbody tr`
 * @param {function} callback - Optional callback that will be run after every search invocation. Called with found shown items and matched terms
 */

// So it's easy to change the attribute prefix everywhere
const attr = (name) => 'data-' + name

export function filterer ({form, table, row = 'tbody td', callback}) {
  form = document.forms[form] || document.forms[0]

  //Flatten multiple same name values in form data to a single stylesheet per unique name
  let styles = {}
  Array.from(form.querySelectorAll('[name]')).forEach(({name}) => {styles[name] = null})
  for (const name in styles) {
    const attribute = attr(name)
    styles[name] = document.head.appendChild(document.createElement('style'))
    styles[name].setAttribute(attribute, '')
  }

  const style = (name, content) => styles[name].innerHTML = content

  //Setup events
  const lazy = debounce(event, 100);
  form.addEventListener('change', lazy)
  form.addEventListener('input', lazy)

  function event() {
    const filters = {}
    const data = new FormData(form)
    //When there's multiple inputs with the same name, their values go under one key, but as a combined space delimited string of values. This makes sure multiple checkboxes with the same name are treated exactly the same as a string with spaces in a text input.
    data.entries().forEach(([name]) => filters[name] = '')
    data.entries().forEach(([name, value]) => filters[name] += value + ' ')

    for (const name in styles) {
      style(name, '')
    }

    for (name in filters) {
      filter(name, filters[name])
    }
  }

  //TODO: make a custom element that takes the args like <filter-able form="form_name_here" rows="optional selector, defauls is this.querySelectorAll('tbody tr')">
  //Set hidden attribute for rows, so they can come from server pre rendered
  //Use url search params for filters, so they can be given in a url, persist over reloads and the form can be submitted to the server and server can render the table if needed. Progressive enhancement for the win!

  function filter (name, value) {
    value = value.trim()
    if (!value) return

    const attribute = attr(name)
    const words = value.split(' ').map(CSS.escape)
    const has = words.map(word => `:has([${attribute}*="${word}" i])`).join('')
    const nothas = `:not(${has})`
    const hide = `${table} ${row}${nothas}`
    const hilites = words.map(word => `${table} ${row} [${attribute}*="${word}" i]`)

    style(name, hide + '{display: none}' + hilites.map(h => h + '{background: var(--hilite-bg)}'))

    if (callback) {
      const rows = document.querySelectorAll(`${table} ${row}${has}`)
      const matches = hilites && document.querySelectorAll(hilites.join(','))
      callback(rows, matches)
    }
  }
}

//This is like five lines so I don't want this as an external dependency.
function debounce (fn, delay) {
  let id;
  return function (...args) {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}