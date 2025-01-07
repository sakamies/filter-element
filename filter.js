/*TODO:
- Row selectors should be has or is, I mean
  :scope > *:is([a*=b][a*=b],:has(a*=b):has(a*=b))
  This would match the row as well as children. Not sure about the perf any more vs walking the dom with a tree walker
- Automatically build index based on textContent of immediate children if index attributes were not provided in server rendered html?
- If not checking for element.dataset, the attribute name could be the tag name like  <div filter--search> instead of <div data-filter--search>. Just less noisy to read and dashed attributes that are the same as the element name sounds rather safe. Not as idiomatic as data-attributes, but dunno, would make this that little bit more understandable I think.
- I don't like setting flags on the name attribute like the name="search:include". I could use form.elements instead of FormData so I could read attributes on the form elements. On the other hand with flags in the name, the flags will go to the server also on submit. Having flags in the name would keep symmetry with everything that's available to filter.js and the server on submit.
*/

/**
 * Custom element to filter contents inside it based on a form.
 * @module Filter
 * @param {string} form - Optional form name or id. If blank, closest parent form or the first form in the document is used.
 * @param {string} target - Optional target element id. Will filter target element children. Optional, defaults to the filter element itself.
 */

export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'target']
  static debounceDelay = 50 //Filter event is async. Max 20fps by default. Plenty often for user input, but hopefully won't grind to a halt if the user pounds their keyboard on a large dataset. Static property because I don't expect it to be customized much, but so it can still be set before instantiating an element if needed.

  selectors = {
    attrExact: (name, value) => `[data-${this.localName}-${name}="${value}" i]`,
    attrIncludes: (name, value) => `[data-${this.localName}-${name}*="${value}" i]`,
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

  get target() {
    return document.getElementById(this.getAttribute('target')) || this
  }

  #styleElement
  get styleElement() {
    this.#styleElement = this.#styleElement || this.appendChild(document.createElement('style'))
    return this.#styleElement
  }

  constructor() {
    super()
    this.handleEvent = debounce(this.handleEvent.bind(this), Filter.debounceDelay)
    // That debounce there returns a new function and thus makes sure this.handleEvent is always a unique new function of this class instance, so addEventListener and removeEventListener add and remove the same function reference.
  }

  connectedCallback() {this.listen()}
  disconnectedCallback() {this.unlisten()}
  adoptedCallback() {this.relisten()} // Makes sure listener is on correct document after element is moved from one document to another.

  #listening
  listen() {
    !this.#listening && document.addEventListener('input', this.handleEvent)
    this.#listening = true
  }
  unlisten() {
    document.removeEventListener('input', this.handleEvent)
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

  // handleEvent calls filter() instead of filter being the event handler, so filter is free to be called any time on the element if needed for whatever reason.
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

  hiliteSelectors([name, value], flags) {
    [name, ...flags] = name.split(':')
    return flags.includes('hilite') && this.attributeSelectors(name, value, flags) || []
  }

  hilite(attrsToHilite) {
    if (attrsToHilite && this.target.id) {
      const selector = `#${this.target.id} ${this.selectors.is(attrsToHilite)}`
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
