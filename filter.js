/**
 * Init filterer
 * @param {node} form - Optional form name to scope event listeners to.
 * @param {string} selector - CSS Selector that targets the items that you want to show or hide based on the . Doesn't have to be a table row, any element will do. Example: `#mytable tbody tr`
 * @param {function} callback - Optional callback that will be run after every search invocation. Called with found shown items and matched terms
 */

export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'row']

  attribute = (name) => 'data-' + this.localName + '-' + name

  #form
  get form() {
    return document.forms[this.#form]
    || this.querySelector('form')
    || document.forms[0]
  }

  #rows = 'tbody tr'
  get rows() {
    return this.querySelectorAll(this.#rows)
  }

  constructor() {
    super()
    const lazy = debounce(this.onsearch.bind(this), 100)
    this.form.addEventListener('input', lazy)
  }

  attributeChangedCallback(name, _, value) {
    if (name === 'form') {this.#form = value}
    if (name === 'row') {this.#rows = value}
  }

  onsearch(e) {
    const rows = Array.from(this.querySelectorAll(this.#rows))
    const filters = Array.from(new FormData(e.target.form))
    const selector = filters.map(entry => this.has(entry)).join('')
    const matches = this.querySelectorAll(`${this.#rows}${selector}`)
    if (!this.dispatch(matches)) return
    const found = Array.from(matches)
    for (const row of rows) {
      row.hidden = !found.includes(row)
    }
  }

  dispatch(found) {
    const event = new CustomEvent(
      this.localName,
      {
        cancelable: true,
        bubbles: true,
        detail: {found},
      }
    )
    return this.dispatchEvent(event)
  }

  has([name, value]) {
    if (!value) return
    const attr = this.attribute(name)
    const words = value.trim().split(' ').map(CSS.escape)
    return words.map(word => `:has([${attr}*="${word}" i])`).join('')
  }
}

//This is like a few lines so I don't want this as an external dependency.
function debounce (fn, delay) {
  let id;
  return function (...args) {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}

//Hilite matched words?
// const hilites = words.map(word => `${this.localName} ${row} [${attribute}*="${word}" i]`)
// style.innerHTML = hilites.map(hilite => hilite + '{background: var(--${this.localName}-hilite)}')
