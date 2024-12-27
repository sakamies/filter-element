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
    || console.warn('No form found for ' + this.localName)
  }

  #rows = 'tbody tr'
  get rows() {
    return this.querySelectorAll(this.#rows)
  }

  constructor() {
    super()
    const lazy = debounce(this.onsearch.bind(this), 100)
    this.form && this.form.addEventListener('input', lazy)
  }

  attributeChangedCallback(name, _, value) {
    if (name === 'form') {this.#form = value}
    if (name === 'row') {this.#rows = value}
  }

  onsearch(e) {
    const rows = Array.from(this.querySelectorAll(this.#rows))
    let data = Array.from(new FormData(e.target.form))
    data = data.filter(([_, value]) => value)

    const has = data.map(entry => this.has(entry)).join('')
    const is = data.map(entry => this.is(entry)).join(',')

    let found = this.querySelectorAll(`${this.#rows}${has}`)
    if (!this.dispatch(found)) return

    found = Array.from(found)
    for (const row of rows) {
      row.hidden = !found.includes(row)
    }

    this.hilite(is)
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
    const attr = this.attribute(name)
    const words = value.trim().split(' ').map(CSS.escape)
    return words.map(word => `:has([${attr}*="${word}" i])`).join('')
  }

    //has() & is() are almost the same, room to simplify.
  is([name, value]) {
    const attr = this.attribute(name)
    const words = value.trim().split(' ').map(CSS.escape)
    return words.map(word => `[${attr}*="${word}" i]`).join(',')
  }

  #style
  hilite(is) {
    this.#style = this.#style || this.appendChild(document.createElement('style'))
    if (!is) {this.#style.innerHTML = ''}
    //TODO: how to scope these styles to only this instance of this element?
    //TODO: Should probably think through what kind of specificity this selector should have, or use something else than <style> for highlighting matches.
    const selector = `${this.localName} ${this.#rows} :is(${is})`
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
