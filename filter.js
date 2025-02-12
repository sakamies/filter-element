export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'target', 'filter-by', 'auto-index']
  static debounceDelay = 50

  get form() {
    return document.forms[this.getAttribute('form')]
    || this.closest('form')
    || document.forms[0]
    || console.warn('No form found for', this)
  }

  get targets() {
    const value = this.getAttribute('target')
    const targets = value && value
      .split(' ')
      .map(str => document.getElementById(str))
      .filter(node => node !== null)
    return targets && targets.length && Array.from(targets) || [this]
  }

  get #filterBy() {
    const value = this.getAttribute('filter-by')
    return value && value.split(' ')
  }

  constructor() {
    super()
    this.#filterDebounced = debounce(this.#filter, Filter.debounceDelay)
    this.#handleEvent = this.#handleEvent
  }

  connectedCallback() {this.#listen()}
  disconnectedCallback() {this.#unlisten()}
  adoptedCallback() {this.#relisten()}

  #listening
  #listen() {
    !this.#listening && document.addEventListener('input', this.#handleEvent)
    !this.#listening && document.addEventListener('change', this.#handleEvent)
    this.#listening = true
  }
  #unlisten() {
    document.removeEventListener('input', this.#handleEvent)
    document.removeEventListener('change', this.#handleEvent)
    this.#listening = false
  }
  #relisten() {
    this.#unlisten()
    this.#listen()
  }

  #handleEvent = (e) => {
    // if (e.target.closest(this.localName) === this) return
    if (e.target.form === this.form) this.#filterDebounced()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'auto-index') {
      if (oldValue !== null) this.#autoIndex(oldValue, 'remove')
      if (newValue !== null) this.#autoIndex(newValue, 'add')
    }
    this.#filterDebounced()
  }

  #autoIndex(name, method) {
    const nodes = this.targets.flatMap(t => Array.from(t.children))
    nodes.map(node => {
      const attributeName = this.localName + '-' + name
      const attributeValue = node.textContent.trim().replaceAll(/\s+/g, ' ')
      if (method === 'add') {
        node.setAttribute(attributeName, attributeValue)
      }
      if (method === 'remove') {
        node.removeAttribute(attributeName)
      }
    })
  }

  #dispatch(target, found, hidden) {
    const event = new CustomEvent(this.localName, {
      cancelable: true,
      bubbles: true,
      detail: {found, hidden},
    })
    return target.dispatchEvent(event)
  }

  #filterDebounced
  #filter = () => {
    const keys = this.#filterBy
    const data = Array.from(new FormData(this.form))
      .filter(([name, value]) => value) // Skip empty values
      .filter(([name, value]) => !keys || keys.includes(name)) // Only consider keys in filter-by attribute if it exists.
    const filterSelector = data.map(this.#getFilterSelector).join('')

    this.targets.map(target => {
      const items = Array.from(target.children)
      const found = Array.from(target.querySelectorAll(':scope > ' + (filterSelector || '*')))
      const hidden = items.map(item => !found.includes(item))
      if (!this.#dispatch(target, found, hidden)) return //Event is cancelable
      items.map(item => item.hidden = !found.includes(item))
    })
  }

  #getFilterSelector = ([name, value], flags) => {
    [name, ...flags] = name.split(':')
    name = CSS.escape(name)
    value = CSS.escape(value)

    const attrSelector = `[${this.localName}-${name}*="${value}" i]`
    const positiveSelector = `:is(${attrSelector},:has(${attrSelector}))`
    const negativeSelector = `:not(${attrSelector}):not(:has(${attrSelector}))`

    return flags.includes('not') ? negativeSelector : positiveSelector
  }
}

function debounce (fn, delay) {
  let id;
  return function (...args) {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}
