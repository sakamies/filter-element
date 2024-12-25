/**
 * Init filterer
 * @param {node} form - Optional form name to scope event listeners to.
 * @param {string} selector - CSS Selector that targets the items that you want to show or hide based on the . Doesn't have to be a table row, any element will do. Example: `#mytable tbody tr`
 * @param {function} callback - Optional callback that will be run after every search invocation. Called with found shown items and matched terms
 */

export class FilterAble extends HTMLElement {
  static observedAttributes = ['form', 'row']

  #form
  get form() {
    return document.forms[this.#form] || this.querySelector('form') || document.forms[0]
  }

  #rows = 'tbody tr'
  get rows() {
    return this.querySelectorAll(this.#rows)
  }

  constructor() {
    super()
  }

  attributeChangedCallback(name, _, value) {
    if (name === 'form') {this.#form = value}
    if (name === 'row') {this.#rows = value}
  }

  connectedCallback() {
    const lazy = debounce(this.onsearch.bind(this), 100)
    this.form.addEventListener('input', lazy)
  }

  disconnectedCallback() {
    //TODO: what kinda cleanup needs to happen on disconnect? No idea.
  }

  onsearch(e) {
    const rows = new Set(this.querySelectorAll(this.#rows))
    const data = new FormData(e.target.form)
    const filters = {}
    let found = new Set(rows)

    // Combine multiple inputs with the same name attribute under one filter as a space delimited string.
    for (const [name, value] of data.entries()) {
      if (filters[name]) {
        filters[name] += ' ' + value
      } else {
        filters[name] = value
      }
    }

    // Query elements based on filters and have the found set contain only all elements that match all filters.
    for (const [name, value] of Object.entries(filters)) {
      if (value) {
        const queried = new Set(this.queryBy(name, value))
        found = found.intersection(queried)
      }
    }

    for (const row of rows) {
      row.hidden = !found.has(row)
    }

    const event = new CustomEvent(
      this.localName + ':search',
      {bubbles: true, detail: {found}}
    )
    this.dispatchEvent(event)
  }

  queryBy(name, value) {
    const attribute = 'data-' + this.localName + '-' + name
    const words = value.trim().split(' ').map(CSS.escape)
    const has = words.map(word => `:has([${attribute}*="${word}" i])`).join('')
    const match = `${this.#rows}${has}`
    const matches = this.querySelectorAll(match)
    return matches
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

//Query hidden rows?
// const nothas = `:not(${has})`
// const hide = `${this.row}${nothas}`
// const hidden = document.querySelectorAll(hide)

//Hilite matched words?
// const hilites = words.map(word => `${this.localName} ${row} [${attribute}*="${word}" i]`)
// style.innerHTML = hilites.map(hilite => hilite + '{background: var(--${this.localName}-hilite)}')