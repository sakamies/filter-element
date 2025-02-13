# Filter

A custom element for filtering a list of elements based on a form.

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

## Kichen sink

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

Check for complete working examples in [index.html](https://sakamies.github.io/filter-element/index.html) and [simple.html](https://sakamies.github.io/filter-element/simple.html).

## Attributes

### `form`

Optional form that you want to have the filter listen to. By default, the filter element finds the closest parent form, or the first form in the document. This attrigute works exactly the same as the [form attribute on input elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form).

### `target`

Optional space separated list of the id's of elements you want to filter. By default the filter elements filters its own children, but you can target any elements with the target attributes.

### `include` & `exclude`

Optional space separated list of [`name`s of the inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#name) you want to filter by. By default, filtering will happen by all inputs in the form that the filter listens to. With include, you can define which exact inputs you want to only listen to. With exclude, you can define which exact inputs you don't want to participate in filtering.

### `index`

## Properties

### `form`

### `targets`

## Events

### `tagName`

----

## Licence, NPM module?

This repo does not have a licence and is not on NPM. Feel free to learn from this, fork the code or make a package. Give credit and [behave](https://www.contributor-covenant.org).

I'm not sure I want to be a package maintainer.
