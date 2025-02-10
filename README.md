# Filter

A custom element for filtering a list of elements based on a form.

## Getting started

- Put filter.js into your project.
- Import the module and name your tag.
- Add a form.
- Add elements to filter.
- Build an automatic index with the `index` attribute.

```html
<script type="module">
  import {Filter} from '/filter.js'
  customElements.define('filter-', Filter);
</script>

<form>
  <label for="search">Search</label>
  <input id="search" name="search">
</form>

<filter- index="search">
  <p>Yks</p>
  <p>Kaks</p>
  <p>Kolme</p>
</filter->
```

