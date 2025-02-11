# Filter

A custom element for filtering a list of elements based on a form.

## Getting started

Put `filter.js` into your project, import it and name your tag whatever you like.

```html
<script type="module">
  import {Filter} from '/filter.js'
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

The attribute is your chosen tag name, a dash and the form element name you want to search by. In this case it's `filter-` + `-` + `search`. Could be for example `my-filter-email` if you named your element `my-filter` and were searching by `email`.

Listen to events any time filtering happens. The event gets the found elements in the details.

```js
document.addEventListener('filter-', event => {
  console.log(event.details.found)
})
```

This event is cancelable with `event.preventDefault()`. Canceling the event prevents filter from showing and hiding elements and you can do whatever you need with the matches yourself.

## Kichen sink

Choose your form and filterable list of elements with `form` and `target` attributes. These attributes expect the ids of the elements you are referring to. You can have multiple targets by adding multiple id's separated by spaces.

The filter attributes can be on any descendants of your target, the immediate children of your target will still get filtered based on those attributes.

All attributes work in combination. You can mix and match autoindexing and manually added filter attributes.

```html
<form id="my-form">...</form>
<filter- form="my-form" target="my-target-one my-target-two" index="textcontent">
  <p>...</p>
  <ul id="my-target-one">
    <li>
      Some content
      <span filter--search="Search term here">Search term here</span>
    </li>
    <li>...</li>
  </ul>
  <p>...</p>
  <ul id="my-target-two">
    ...
  </ul>
</filter->
```

Check for complete working examples in [index.html](sakamies.github.io/filter-element/index.html) and [simple.html](sakamies.github.io/filter-element/simple.html).

----

## Licence, NPM module?

This repo does not have a licence and is not on NPM. Feel free to learn from this, fork the code or make a package. Give credit and [behave](https://www.contributor-covenant.org).

I'm not sure I want to be a package maintainer.
