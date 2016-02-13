# frankly
`Frankly` is a summary dashboard about the open issues and PRs across any set of GitHub repositories.
Because, frankly, we need one.

## Installing and running the demo

```
git clone https://github.com/notwaldorf/frankly.git
cd frankly
bower install
python -m SimpleHTTPServer ## or your favourite local server
```

## Sample use

This is what the `index.html` contains
```html
<!-- HTML imports for Polymer element and the Web Components polyfill -->
<script src="bower_components/webcomponentsjs/webcomponents-lite.js"></script>
<link rel="import" href="frank-ly.html">

<!-- The whole dashboard -->
<frank-ly
    header="🚂🚃🚃💨"
    repos='["frankly", "emoji-rain", "emoji-selector", "github-canned-responses"]'
    labels='["bug", "enhancement"]'>
</frank-ly>
```
And that's literally it. It looks like this:

<img width="731" alt="screenshot of the dashboard" src="https://cloud.githubusercontent.com/assets/1369170/13004257/4fa52f30-d12f-11e5-8978-09e62e076063.png">

## Configuring it

By default, the dashboard looks at the repositories under the authenticated
user's username, however it can be configured to use an organization, or even
a mix of repositories from different users and organizations:

### All the repositories the user is subscribed to

```html
<frank-ly header="🚂🚃🚃💨"
    labels='["bug", "enhancement"]'>
</frank-ly>
```

### Repositories for a specific organization

```html
<frank-ly
    organization="polymerelements"
    repos='["paper-input", "paper-button"]'
    labels='["bug", "enhancement"]'>
</frank-ly>
```

### Repositories for a mix of users and organization

```html
<frank-ly
    full-repo-names
    repos='["notwaldorf/emoji-rain", "notwaldorf/caturday-post", "polymerelements/paper-input", "jquery/jquery"]'
    labels='["bug", "enhancement"]'>
</frank-ly>
```

You can also configure which labels you want to display. `Untriaged`
is always the open issues that have no labels applied to them.

## Multiple dashboards in parallel

To use multiple dashboards for the same user, just use the `<frankly-header>`
element directly, with multiple `<frankly-result>` elements. A `dom-bind` is a
special Polymer construct that allows you to easily bind data together (in this
case, the authenticated user:

```html
<!-- HTML imports for Polymer element and the Web Components polyfill -->
<script src="bower_components/webcomponentsjs/webcomponents-lite.js"></script>
<link rel="import" href="frankly-header.html">
<link rel="import" href="frankly-results.html">

<template is="dom-bind">
  <frankly-header
    header="Look at this dashboard go!"
    github-user="{{user}}"></frankly-header>
  <frankly-results
      github-user="[[user]]"
      repos='["emoji-rain", "emoji-translate"]'
      labels='["bug", "enhancement"]'>
  </frankly-results>
  <frankly-results
      github-user="[[user]]"
      full-repo-names
      repos='["notwaldorf/caturday-post", "polymerelements/paper-input", "jquery/jquery"]'
      labels='["bug", "enhancement", "help wanted"]'>
  </frankly-results>
</template>
```

## Private repos?
At the moment `Frankly` only works for public repos, since it's requesting
the least amount of permissions from GitHub -- my understanding is that
the permissions needed to access anything about private repos require
read/write access to _all of_ that organization's repos, which is a bit scary.

## <3
Hope this helps you stay on top of issues and PRs!
