export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'target', 'include', 'exclude', 'index']
  static debounceDelay = 50
  static listenedEvents = ['input', 'change']

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

  get #include() {
    const value = this.getAttribute('include')
    return value && value.split(' ')
  }

  get #exclude() {
    const value = this.getAttribute('exclude')
    return value && value.split(' ')
  }

  constructor() {
    super()
    this.#filterDebounced = debounce(this.#filterSync, Filter.debounceDelay)
    this.#handleEvent = this.#handleEvent
  }

  connectedCallback() {this.#listen()}
  disconnectedCallback() {this.#unlisten()}
  adoptedCallback() {this.#relisten()}

  #listening = []
  #listen() {
    if (this.#listening.length) return
    this.#listening = Filter.listenedEvents
    this.#listening.forEach(name => document.addEventListener(name, this.#handleEvent))
  }
  #unlisten() {
    if (!this.#listening.length) return
    this.#listening.forEach(name => document.removeEventListener(name, this.#handleEvent))
    this.#listening = []
  }
  #relisten() {
    this.#unlisten()
    this.#listen()
  }

  #handleEvent = (e) => {
    if (e.target.form === this.form || e.target === this.form) this.#filterDebounced()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'index') {
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
  #filterSync = () => {
    const includedNames = this.#include
    const excludedNames = this.#exclude
    const data = Array.from(new FormData(this.form))
      .filter(([name, value]) => value)
      .filter(([name, value]) => !includedNames || includedNames.includes(name))
      .filter(([name, value]) => !excludedNames || !excludedNames.includes(name))
    const filterSelector = data.map(this.#getFilterSelector).join('')

    this.targets.map(target => {
      const items = Array.from(target.children)
      const found = Array.from(target.querySelectorAll(':scope > ' + (filterSelector || '*')))
      const hidden = items.map(item => !found.includes(item))
      if (!this.#dispatch(target, found, hidden)) return 
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
