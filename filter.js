/**
 * Init filterer
 * @param {node} form - Optional form name to scope event listeners to.
 * @param {string} selector - CSS Selector that targets the items that you want to show or hide based on the . Doesn't have to be a table row, any element will do. Example: `#mytable tbody tr`
 * @param {function} callback - Optional callback that will be run after every search invocation. Called with found shown items and matched terms
 */

export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'row']

  attribute = (name) => 'data-' + this.localName + '-' + name
  has = (selector) => `:has(${selector})`
  is = (selector) => `:is(${selector})`
  not = (selector) => `:not(${selector})`

  #form
  get form() {
    return document.forms[this.#form]
    || this.querySelector('form')
    || document.forms[0]
    || console.warn('No form found for ' + this.localName)
  }

  #rows = 'tbody tr'
  get rows() {
    return this.querySelectorAll(this.#rows)
  }

  constructor() {
    super()
    const lazy = debounce(this.filter.bind(this), 100)
    this.form && this.form.addEventListener('input', lazy)
  }

  attributeChangedCallback(name, _, value) {
    if (name === 'form') {this.#form = value}
    if (name === 'row') {this.#rows = value}
  }

  filter() {
    const rows = Array.from(this.querySelectorAll(this.#rows))
    let data = Array.from(new FormData(this.form))
    data = data.filter(([_, value]) => value)

    let select = data.flatMap(([name, value]) => this.selectBy(name, value))
    select = select.join('')

    let found = this.querySelectorAll(`${this.#rows}${select}`)
    if (!this.dispatch(found)) return

    found = Array.from(found)
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

  selectBy(name, value, not = '') {
    [name, not] = name.split(/(?=:)/)

    const attr = this.attribute(name)
    const words = value.trim().split(' ').map(CSS.escape)
    const attrs = words.map(word => `[${attr}*="${word}" i]`)

    const has = attrs.map(a => this.has(a)).join('')
    return not === ':not' && this.not(has) || has
  }

  #style
  hilite(name, value, hilite = '') {
    this.#style = this.#style || this.appendChild(document.createElement('style'))
    if (!is) {this.#style.innerHTML = ''}

    [name, hilite] = name.split(/(?=:)/)
    if (hilite !== ':hilite') return

    const attr = this.attribute(name)
    const words = value.trim().split(' ').map(CSS.escape)
    const attrs = words.map(word => `[${attr}*="${word}" i]`)

    const is = this.is(attrs.join(''))

    //TODO: how to scope these styles to only this instance of this element?
    //TODO: Should probably think through what kind of specificity this selector should have, or use something else than <style> for highlighting matches.
    const selector = `${this.localName} ${this.#rows} ${is}`
    const text = `var(--${this.localName}-marktext, MarkText)`
    const mark = `var(--${this.localName}-mark, Mark)`
    this.#style.innerHTML = `${selector} {color: ${text}; background: ${mark};`
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
