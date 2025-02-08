/**
 * Custom element to filter contents inside it based on a form.
 * @module Filter
 * @param {string} form - Optional form name or id. If blank, closest parent form or the first form in the document is used.
 * @param {string} target - Optional target element id. Will filter target element children. Optional, defaults to the filter element itself.
 */

export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'target']
  static debounceDelay = 50

  selectors = {
    attrExact: (name, value) => `[${this.localName}-${name}="${value}" i]`,
    attrIncludes: (name, value) => `[${this.localName}-${name}*="${value}" i]`,
    has: str => `:has(${str})`,
    is: str => `:is(${str})`,
    not: str => `:not(${str})`,
  }

  get form() {
    return document.forms[this.getAttribute('form')]
    || this.closest('form')
    || document.forms[0]
    || console.warn('No form found for', this)
  }

  get targets() {
    const targets = this.getAttribute('target')
      .split(' ')
      .map(str => document.getElementById(str))
      .filter(node => node !== null)
    return targets && targets.length && Array.from(targets) || [this]
  }

  #styleElement
  get styleElement() {
    this.#styleElement = this.#styleElement || this.appendChild(document.createElement('style'))
    return this.#styleElement
  }

  constructor() {
    super()
    this.filter = debounce(this.filter.bind(this), Filter.debounceDelay)
    this.handleEvent = this.handleEvent.bind(this)
  }

  connectedCallback() {this.listen()}
  disconnectedCallback() {this.unlisten()}
  adoptedCallback() {this.relisten()}

  #listening
  listen() {
    !this.#listening && document.addEventListener('input', this.handleEvent)
    !this.#listening && document.addEventListener('change', this.handleEvent)
    this.#listening = true
  }
  unlisten() {
    document.removeEventListener('input', this.handleEvent)
    document.removeEventListener('change', this.handleEvent)
    this.#listening = false
  }
  relisten() {
    this.unlisten()
    this.listen()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.filter()
  }

  handleEvent(e) {
    if (e.target.form === this.form) this.filter()
  }

  dispatch(found) {
    const event = new CustomEvent(this.localName, {
      cancelable: true,
      bubbles: true,
      detail: {found},
    })
    return this.dispatchEvent(event)
  }

  filter() {
    this.targets.forEach(target => this.filterTarget(target))
  }

  filterTarget(target) {
    const items = Array.from(target.children)
    const data = Array.from(new FormData(this.form)).filter(([_, v]) => v)
    const hasAttrs = data.map(this.hasAttributeSelectors, this).join('')

    const found = Array.from(target.querySelectorAll(':scope > ' + (hasAttrs || '*')))
    if (!this.dispatch(found)) return //Event is cancelable
    items.forEach(item => item.hidden = !found.includes(item))

    this.hilite(data.flatMap(this.getHiliteSelectors, this).join(','))
  }

  attributeSelectors(name, value, flags) {
    name = CSS.escape(name)
    let attrs
    if (flags.includes('exact')) {
      attrs = [this.selectors.attrExact(name, CSS.escape(value))]
    } else if (flags.includes('includes')) {
      attrs = [this.selectors.attrIncludes(name, CSS.escape(value))]
    } else {
      const words = value.trim().split(' ').map(CSS.escape)
      attrs = words.map(word => this.selectors.attrIncludes(name, word))
    }
    return attrs
  }

  hasAttributeSelectors([name, value], flags) {
    [name, ...flags] = name.split(':')
    const selector = this.attributeSelectors(name, value, flags).map(this.selectors.has).join('')
    return flags.includes('not') && this.selectors.not(selector) || selector
  }

  getHiliteSelectors([name, value], flags) {
    [name, ...flags] = name.split(':')
    return flags.includes('hilite') && this.getAttributeSelectors(name, value, flags) || []
  }

  hilite(selectors) {
    const styles = this.targets.map(target => {
      if (selectors && target.id) {
        const selector = `#${target.id} ${this.selectors.is(selectors)}`
        const text = `var(--${this.localName}-marktext, MarkText)`
        const mark = `var(--${this.localName}-mark, Mark)`
        return `${selector} {color: ${text}; background-color: ${mark};}`
      } else {
        return ''
      }
    })
    this.styleElement.innerHTML = styles.join('\n')
  }
}

function debounce (fn, delay) {
  let id;
  return function (...args) {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}
