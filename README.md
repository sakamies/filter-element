# Filter

A custom element for filtering a list of elements based on a form.

No dependencies. No CSS necessary. Works with any type and any number of inputs. Less than 1k at best, about 4k as source.

- [Progressive enhancement](#progressive-enhancement)
- [Getting started](#getting-started)
- [Kitchen sink](#kitchen-sink)
- [Live examples](#live-examples)
- [Attributes](#attributes)
- [Properties](#properties)
- [Events](#events)
- [Licence, NPM module?](#licence-npm-module)

## Progressive enhancement

Now this is [the important bit](https://piccalil.li/blog/its-about-time-i-tried-to-explain-what-progressive-enhancement-actually-is/).

The filter element works just fine with any server rendered markup or forms that are to be submitted. It's here to help, not to require anything of you.

Filter does not add or remove elements from the DOM, but doesn't mind if you do. Everything should continue to work fine if you add/move/remove your forms, inputs, elements to be filtered, their attributes or any filter elements themselves. If you do modify your list of elements to be filtered, dispatch a change event on your form element to re-filter the list. Filter does not actively monitor DOM changes, it listens to input and change events and tries to stay out of your way.

Filtering will work even if CSS fails. Filter uses [the `hidden` attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/hidden) to show & hide elements.

You can render your filterable list using the `hidden` attribute server side and let filter pick up from there on the front end. You can leave the list unfiltered when rendering even if the form is populated for filtering if you want the whole list to be readable by your users in case javascript is not available.

## Getting started

Put `filter.js` into your project, import it and name your tag whatever you like.

```html
<script type="module">
  import {Filter} from './filter.js'
  customElements.define('filter-', Filter);
</script>
```

Add a form to do the filtering with. Works with any type of form elements.

```html
<form>
  <label for="search">Search</label>
  <input id="search" name="search">
</form>
```

Add some content to filter. Build an automatic index with the `index` attribute...

```html
<filter- index="search">
  <p>One</p>
  <p>Two</p>
</filter->
```

...or make your own index with attributes on any descendants of your filter.

```html
<filter->
  <p filter--search="One">One</p>
  <p filter--search="Two">Two</p>
</filter->
```

The attribute is your chosen tag name, a dash and the form element name you want this data to match to. In this case it's `filter-` + `-` + `search`. Could be for example `my-filter-email` if you named your element `my-filter` and were searching by `email`.

Listen to events any time filtering happens.

```js
document.addEventListener('filter-', event => {
  console.log(event.target, event.details.found, event.details.hidden)
})
```

- `event target` is the list of elements that is being filtered.
- Gets found and hidden elements in its details.
- Cancelable with `event.preventDefault()`. Canceling the event prevents filter from showing and hiding elements and you can do whatever you need with the matches yourself.

## Kitchen sink

Choose your form, fields to filter by and filterable list of elements with `form`, `include`, `exclude` `target` attributes. `form` and `target` attributes expect the ids of the elements you are referring to. `include` and `exclude` expect the `name`s of the inputs you want to participate in filtering. You can have multiple includes, excludes and targets by adding multiple names and id's separated by spaces.

The filter attributes can be on any descendants of your target, the immediate children of your target will still get filtered based on those attributes.

All attributes work in combination. You can mix and match autoindexing and manually added filter attributes.

```html
<form id="my-form">
  …
  <input name="name-one" …>
  …
</form>
<filter- form="my-form" target="my-target-one my-target-two" include="name-one name-two" index="search">
  <p>…</p>
  <ul id="my-target-one">
    <li>
      Some content
      <span filter--custom="Custom search term">
        Custom search term
      </span>
    </li>
    <li>…</li>
  </ul>
  <p>…</p>
  <ul id="my-target-two">…</ul>
</filter->
```

You can style the matches, they don't have to be hidden.

```css
#my-list > [hidden] {
  display: list-item;
}
#my-list > :not([hidden]) {
  background: lemonchiffon;
}
```

## Live examples

Check some complete working examples.

- [index.html](https://sakamies.github.io/filter-element/index.html)
- [simple.html](https://sakamies.github.io/filter-element/simple.html)
- [combobox.html](https://sakamies.github.io/filter-element/combobox.html)

## Attributes

### `form`

Optional form that you want to have the filter listen to. By default, the filter element finds the closest parent form, or the first form in the document. This attribute works exactly the same as the [form attribute on input elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form).

### `target`

Optional space separated list of the id's of elements you want to filter. By default the filter elements filters its own children, but you can target any elements with the target attributes.

### `include` & `exclude`

Optional space separated list of [`name`s of the inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#name) you want to filter by. By default, filtering will happen by all inputs in the form that the filter listens to. With include, you can define which exact inputs you want to only listen to. With exclude, you can define which exact inputs you don't want to participate in filtering.

### `index`

Build an automatic index for your chosen form field by setting `index="field-name-here"`.

### `tagName-fieldName`

Build a manual search index by setting attributes on any descendants of your [filter targets](#target).

The attribute is your chosen tag name, a dash and the form element name you want this data to match to. For example `my-filter-search` to filter by any inputs that have the name `search`.

This gives great flexibility to add attributes to the tags that hold your relevant data. Use any number of attributes that match any number of inputs.

## Properties

### `form`

Read only. The form that the filter instance listens to.

### `targets`

Read only. Array of target elements that the filter instance is filtering.

## Events

### `tagName`

Any time filtering happens, the filter element will emit one event per a target that is being filtered. The event name is the tag name you chose for your filter element.

`event.target` is the target being filtered.

`event.detail.found` & `event.detail.hidden` contain the children of `target` that matched and didn't match the filter.

`event.preventDefault()` will cancel the filter setting the `hidden` property on `found` and `hidden` elements.

## Configuration

You can set static properties on the class to change the defaults. These options will affect any new instantiated elements, not elements that already exist in the DOM.

### `Filter.debounceDelay = 50`

Filtering is debounced by 50ms by default, so typing quickly optimally won't grind the page to a halt on large datasets. You can adjust this by setting `Filter.debounceDelay = 100` or any number of milliseconds if you need to.

### `Filter.listenedEvents = ['input', 'change']`

Filter listens to input and change events by default. You can listen to any events you need to, but the event needs to originate from your form. I must have a form property on its target, or the target must be the form. Filter checks internally that `event.target.form === this.form || event.target === this.form` when handling events.

----

## Licence, NPM module?

This whole repo is more of a journey of learning and writing, not necessarily meant as a participant in the packages & components ecosystem. Though I've poured everything I know so far into this and it should be fully production ready — *and I am using it in production* — I'm not promising anything.

This repo does not have a licence and is [not on NPM](https://htmx.org/essays/vendoring/). You do not have my permission for anything, but I hope your rebel spirit will let you learn from this, to code your own and make a package. Give credit and [behave](https://www.contributor-covenant.org).