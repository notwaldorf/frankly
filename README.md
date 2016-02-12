# frankly
`Frankly` is a summary dashboard about the open issues and PRs for a given set of GitHub repositories.
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

<frank-ly
    header="🚂🚃🚃💨"
    repos='["emoji-rain", "emoji-selector", "github-canned-responses"]'
    labels='["bug", "enhancement"]'>
</frank-ly>
```
And that's literally it. It looks like this:

<img width="731" alt="screenshot of the dashboard" src="https://cloud.githubusercontent.com/assets/1369170/13004257/4fa52f30-d12f-11e5-8978-09e62e076063.png">

## Configuring it

By default, the dashboard looks at the repositories under the authenticated
user's username, however it can be configured to use an organization, or even
a mix of repositories from different users and organizations:

```html
<!-- Repositories for a specific organization -->
<frank-ly
    organization="polymerelements"
    repos='["paper-input", "paper-button"]'
    labels='["bug", "enhancement"]'>
</frank-ly>

<!-- Repositories for a mix of users and organization -->
<frank-ly
    full-repo-names
    repos='["notwaldorf/emoji-rain", "notwaldorf/caturday-post", "polymerelements/paper-input", "jquery/jquery"]'
    labels='["bug", "enhancement"]'>
</frank-ly>
```

You can also configure which labels you want to display. `Untriaged`
is always the open issues that have no labels applied to them.

## Multiple dashboards in parallel

To use multiple dashboards for the same user, just use the `<dash-header>`
element directly, with multiple `<dash-result>` elements:

```html
<!-- HTML imports for Polymer element and the Web Components polyfill -->
<script src="bower_components/webcomponentsjs/webcomponents-lite.js"></script>
<link rel="import" href="dash-header.html">
<link rel="import" href="dash-results.html">

<template is="dom-bind">
  <dash-header
    header="Look at this dashboard go!"
    github-user="{{user}}"></dash-header>
  <frank-ly
      github-user="[[user]]"
      repos='["emoji-rain", "emoji-translate"]'
      labels='["bug", "enhancement"]'>
  </frank-ly>
  <frank-ly
      full-repo-names
      repos='["notwaldorf/caturday-post", "polymerelements/paper-input", "jquery/jquery"]'
      labels='["bug", "enhancement", "help wanted"]'>
  </frank-ly>
</template>
```

## <3
Hope this helps you stay on top of issues and PRs!
