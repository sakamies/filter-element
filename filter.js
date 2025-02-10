/**
 * Custom element to filter contents inside it based on a form.
 * @module Filter
 * @param {string} form - Optional form name or id. Optional, defaults to closest parent form or the first form in the document.
 * @param {string} target - Optional target element id. Will filter target element children. Optional, defaults to the filter element itself.
 */

const attrExact = (prefix, name, value) => `[${prefix}-${name}="${value}" i]`
const attrIncludes = (prefix, name, value) => `[${prefix}-${name}*="${value}" i]`
const has = str => `:has(${str})`
const is = str => `:is(${str})`
const not = str => `:not(${str})`
const or = (...strs) => strs.join(',')
const and = (...strs) => strs.join('')

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
    const attr = this.getAttribute('target')
    const targets = attr && attr
      .split(' ')
      .map(str => document.getElementById(str))
      .filter(node => node !== null)
    return targets && targets.length && Array.from(targets) || [this]
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
    if (name === 'index') {
      if (oldValue !== null) this.index(oldValue, 'remove')
      if (newValue !== null) this.index(newValue, 'add')
    }
    this.filter()
  }

  index(name, method) {
    const nodes = this.targets.flatMap(t => Array.from(t.children))
    nodes.forEach(node => {
      if (method === 'add') {
        node.setAttribute(this.localName + '-' + name, node.textContent)
      }
      if (method === 'remove') {
        node.removeAttribute(this.localName + '-' + name)
      }
    })
  }

  handleEvent(e) {
    if (e.target.form === this.form) this.filter()
  }

  dispatch(target, found) {
    const event = new CustomEvent(this.localName, {
      cancelable: true,
      bubbles: true,
      detail: {found},
    })
    return target.dispatchEvent(event)
  }

  filter() {
    this.targets.forEach(target => this.filterTarget(target))
  }

  filterTarget(target) {
    const items = Array.from(target.children)
    const data = Array.from(new FormData(this.form)).filter(([_, v]) => v)
    const filterSelector = and(data.map(this.getFilterSelector, this))

    const found = Array.from(target.querySelectorAll(':scope > ' + (filterSelector || '*')))
    if (!this.dispatch(target, found)) return //Event is cancelable
    items.forEach(item => item.hidden = !found.includes(item))
  }

  // Returns an array of attribute selectors ['[a*=b]', '[a*=b]']
  getEntrySelectors(name, value, flags) {
    name = CSS.escape(name)
    const tag = this.localName
    if (flags.includes('exact')) {
      return [attrExact(tag, name, CSS.escape(value))]
    }
    else if (flags.includes('fuzzy')) {
      const words = value.trim().split(' ').map(CSS.escape)
      return words.map(word => attrIncludes(tag, name, word))
    }
    else {
      return [attrIncludes(tag, name, CSS.escape(value))]
    }
  }

  // Returns either format based on flag
  // :is([a*=b][a*=b],:has([a*=b]):has([a*=b]))
  // :not([a*=b][a*=b]):not(:has([a*=b]):has([a*=b]))
  getFilterSelector([name, value], flags) {
    [name, ...flags] = name.split(':')

    const entrySelectors = this.getEntrySelectors(name, value, flags)
    const isSelector = and(entrySelectors)
    const hasSelector = and(entrySelectors.map(has))
    const positiveSelector = is(or(isSelector, hasSelector))
    const negativeSelector = and(not(isSelector), not(hasSelector))

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
