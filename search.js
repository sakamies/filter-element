/**
 * Init filterer
 * @param {node} listen - Where to listen for change & input events. Set to your radio group element if you want to filter to radios.
 * @param {string} row - CSS Selector that targets the rows that you want to show or hide. Doesn't have to be a table row, any element will do. Example: `#mytable tbody tr`
 * @param {string} match - Selector for elements inside your rows that contain your search terms. Example `:is(th, td)`
 * @param {function} callback - Optional callback that will be run after every search invocation. Called with found shown items and matched terms
 */

export function filterer ({name, row, callback}) {
  const lazy = debounce(filter, 100);
  const attribute = 'data-' + name
  const style = document.head.appendChild(document.createElement('style'))
  style.setAttribute(attribute, '')

  document.addEventListener('change', lazy)
  document.addEventListener('input', lazy)


  function filter (e) {
    if (e.target.name !== name) return

    const words = e.target.value.split(' ').map(CSS.escape).filter(t => t != "")

    // Selectors
    const has = words.map(word => `:has([${attribute}*="${word}" i])`).join('')
    const nothas = `:not(${has})`
    const hide = `${row}${nothas}`
    const hilites = words.map(word => `${row} [${attribute}*="${word}" i]`)

    // Write actual css
    style.innerHTML = hide + '{display: none}' + hilites.map(h => h + '{background: var(--hilite-bg)}')

    if (callback) {
      const rows = document.querySelectorAll(`${row}${has}`)
      const matches = hilites.length && document.querySelectorAll(hilites.join(','))
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