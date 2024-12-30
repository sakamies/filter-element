/**
 * Custom element to filter contents inside it based on a form.
 * @module Filter
 * @param {string} form - Optional form name or id. If blank, the first form inside the element instance, or the first form in the document is used.
 * @param {string} rows - CSS Selector that targets the items that you want to show or hide based on the form. Doesn't have to be a table row, any element will do. Example: `#mytable .card`
 */

let style
const sel = {
  tag: '',
  form: '',
  rows: 'tbody tr',
  attr: (name, value) => `[data-${sel.tag}-${name}*="${value}" i]`,
  has: str => `:has(${str})`,
  is: str => `:is(${str})`,
  not: str => `:not(${str})`,
}

export class Filter extends HTMLElement {
  static observedAttributes = ['form', 'rows']

  get form() {
    return document.forms[sel.form]
    || this.querySelector('form')
    || document.forms[0]
    || console.warn('No form found for', this)
  }

  get rows() {
    return this.querySelectorAll(sel.rows)
  }

  constructor() {
    super()
    sel.tag = this.localName
    style = style || this.appendChild(document.createElement('style'))
    const lazy = debounce(this.filter.bind(this), 100)
    this.form && this.form.addEventListener('input', lazy)

    // (new MutationObserver(lazy)).observe(this, {
    //   childList: true,
    //   subtree: true,
    //   attributes: true,
    // })
  }

  attributeChangedCallback(name, _, value) {
    sel[name] = value
    this.filter()
  }

  dispatch(found) {
    const event = new CustomEvent(sel.tag, {
      cancelable: true,
      bubbles: true,
      detail: {found},
    })
    return this.dispatchEvent(event)
  }

  filter() {
    const rows = this.querySelectorAll(sel.rows)
    const data = Array.from(new FormData(this.form)).filter(([_, v]) => v)
    const rowHas = data.map(this.hasAttributeSelectors, this).join('')

    const found = this.querySelectorAll(sel.rows+rowHas)
    if (!this.dispatch(found)) return

    const shown = Array.from(found)
    rows.forEach(row => row.hidden = !shown.includes(row))

    this.hilite(data.flatMap(this.hiliteSelectors, this).join(','))
  }

  attributeSelectors(name, value) {
    name = CSS.escape(name)
    const words = value.trim().split(' ').map(CSS.escape)
    let attrs = words.map(word => sel.attr(name, word))
    return attrs
  }

  hasAttributeSelectors([name, value], flag) {
    [name, flag] = name.split(':')
    const selector = this.attributeSelectors(name, value).map(sel.has).join('')
    return flag === 'not' && sel.not(selector) || selector
  }

  hiliteSelectors([name, value], flag) {
    [name, flag] = name.split(':')
    return flag === 'hi' && this.attributeSelectors(name, value) || []
  }

  hilite(attrsToHilite) {
    // TODO: this is really simple, but using Range() and ::highlight() would be more accurate. Not sure if it's worth the complexity.
    const selector = `${sel.rows} ${sel.is(attrsToHilite)}`
    const text = `var(--${sel.tag}-marktext, MarkText)`
    const mark = `var(--${sel.tag}-mark, Mark)`
    style.innerHTML = `@scope {${selector} {color: ${text}; background-color: ${mark};}`
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
