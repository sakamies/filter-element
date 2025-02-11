export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'target', 'index']
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

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'index') {
      if (oldValue !== null) this.#index(oldValue, 'remove')
      if (newValue !== null) this.#index(newValue, 'add')
    }
    this.#filterDebounced()
  }

  #index(name, method) {
    const nodes = this.targets.flatMap(t => Array.from(t.children))
    nodes.map(node => {
      if (method === 'add') {
        node.setAttribute(this.localName + '-' + name, node.textContent)
      }
      if (method === 'remove') {
        node.removeAttribute(this.localName + '-' + name)
      }
    })
  }

  #handleEvent = (e) => {
    if (e.target.form === this.form) this.#filterDebounced()
  }

  #dispatch(target, found) {
    const event = new CustomEvent(this.localName, {
      cancelable: true,
      bubbles: true,
      detail: {found},
    })
    return target.dispatchEvent(event)
  }

  #filterDebounced
  #filter = () => {
    this.targets.map(target => {
      const items = Array.from(target.children)
      const data = Array.from(new FormData(this.form)).filter(([_, v]) => v)
      const filterSelector = data.map(this.#getFilterSelector).join('')

      const found = Array.from(target.querySelectorAll(':scope > ' + (filterSelector || '*')))
      if (!this.#dispatch(target, found)) return //Event is cancelable
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
