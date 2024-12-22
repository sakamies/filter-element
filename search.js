/**
 * Init filterer
 * @param {node} listen - Where to listen for change & input events. Set to your radio group element if you want to filter to radios.
 * @param {node} scope - Target element that has its contents filtered.
 * @param {selector} item - Selector for items that get shown/hidden based on search.
 * @param {selector} match - Selector for search terms inside the items.
 * @param {function} callback - Callback that will be run after every search invocation. Called with found matches as its only parameter.
 */
export function filterer ({listen, selectors: {scope, item, match}, callback}) {
  const style = document.head.appendChild(document.createElement('style'))

  // Mangle search attribute name from `match` selector.
  const attribute = btoa(match).replace(/\+/g, 'plus').replace(/\//g, 'slash').replace(/=+$/, 'equals');

  // Build search index
  Array.from(document.querySelectorAll(`${scope} ${item} ${match}`)).forEach(el => {
    el.setAttribute(attribute, el.textContent)
  })

  const lazy = debounce(filter, 100);
  listen.addEventListener('change', lazy)
  listen.addEventListener('input', lazy)

  // The actual filtering
  function filter ({target: {value}}) {
    const words = value.split(' ').map(CSS.escape).filter(t => t != "")
    const has = words.map(word => `:has(${match}[${attribute}*="${word}" i])`).join('')
    const nothas = `:not(${has})`
    const hide = `${scope} ${item}${nothas} {display: none}`
    const hilites = words.map(word => `${item} ${match}[${attribute}*="${word}" i] {background: LemonChiffon}`)

    // If we wanted to highlight search terms.
    style.innerHTML = hide + hilites.join('\n')
    callback(document.querySelectorAll(`${scope} ${item}${has}`))
  }
}

//This is like five lines so don't want this as an external dependency.
function debounce (fn, delay) {
  let id;
  return function (...args) {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}