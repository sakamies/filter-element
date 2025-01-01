/**
 * Custom element to filter contents inside it based on a form.
 * @module Filter
 * @param {string} form - Optional form name or id. If blank, closest parent form or the first form in the document is used.
 * @param {string} target - Optional target element id. Will filter target element children. Optional, defaults to the filter element itself.
 */

export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'target']
  //TODO: attribute like "exact" or something to have only exact matches?

  styleElement
  selectors = {
    attr: (name, value) => `[data-${this.localName}-${name}*="${value}" i]`,
    has: str => `:has(${str})`,
    is: str => `:is(${str})`,
    not: str => `:not(${str})`,
  }

  get form() {
    return document.forms[this.getAttribute('form')]
    || this.querySelector('form')
    || this.closest('form')
    || document.forms[0]
    || console.warn('No form found for', this)
  }

  get target() {
    return document.getElementById(this.getAttribute('target')) || this
  }

  constructor() {
    super()
    this.styleElement = this.styleElement || this.appendChild(document.createElement('style'))
    this.filterDebounced = debounce(this.filter.bind(this), 50)
    this.form && this.form.addEventListener('input', this.filterDebounced)
  }

  attributeChangedCallback(name, _, value) {
    this.filterDebounced()
  }

  dispatch(found) {
    const event = new CustomEvent(this.localName, {
      cancelable: true,
      bubbles: true,
      detail: {found},
    })
    return this.dispatchEvent(event)
  }

  filterDebounced
  filter() {
    const items = Array.from(this.target.children)
    const data = Array.from(new FormData(this.form)).filter(([_, v]) => v)
    const hasAttrs = data.map(this.hasAttributeSelectors, this).join('')

    const found = Array.from(this.target.querySelectorAll(':scope > ' + (hasAttrs || '*')))
    if (!this.dispatch(found)) return //Event is cancelable
    items.forEach(item => item.hidden = !found.includes(item))

    this.hilite(data.flatMap(this.hiliteSelectors, this).join(','))
  }

  attributeSelectors(name, value, flags) {
    name = CSS.escape(name)
    const words = value.trim().split(' ').map(CSS.escape)
    let attrs = words.map(word => this.selectors.attr(name, word))
    return attrs
  }

  hasAttributeSelectors([name, value], flags) {
    [name, ...flags] = name.split(':')
    const selector = this.attributeSelectors(name, value, flags).map(this.selectors.has).join('')
    return flags.includes('not') && this.selectors.not(selector) || selector
  }

  hiliteSelectors([name, value], flags) {
    [name, ...flags] = name.split(':')
    return flags.includes('hilite') && this.attributeSelectors(name, value, flags) || []
  }

  hilite(attrsToHilite) {
    // TODO: this is really simple, but using Range() and ::highlight() would be more accurate. Not sure if it's worth the complexity.
    if (attrsToHilite && this.id) {
      const selector = `#${this.id} ${this.rowsSelector} ${this.selectors.is(attrsToHilite)}`
      const text = `var(--${this.localName}-marktext, MarkText)`
      const mark = `var(--${this.localName}-mark, Mark)`
      this.styleElement.innerHTML = `${selector} {color: ${text}; background-color: ${mark};`
    } else {
      this.styleElement.innerHTML = ''
    }
  }
}

// This is like a few lines so I don't want this as an external dependency.
// Not sure debounce necessary, but I would like to be as kind as I can to peoples devices. Like if you really pound your keyboard and the table is huge, maybe then this is needed.
function debounce (fn, delay) {
  let id;
  return function (...args) {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}
