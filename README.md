# github-triage-dashboard

A Polymer element that will show you a dashboard of statistics about
the open issues and PRs for a given set of GitHub repositories.

## Installing and running the demo

```
git clone https://github.com/notwaldorf/github-triage-dashboard.git
cd github-triage-dashboard
bower install
python -m SimpleHTTPServer ## or your favourite local server
```

## Sample use

Add this to an `index.html`, after you do the steps above.
```html
<!-- HTML imports for Polymer element and the Web Components polyfill -->
<script src="bower_components/webcomponentsjs/webcomponents-lite.js"></script>
<link rel="import" href="dash-board.html">

<dash-board
    header="hai I am trapped in a dashboard <3"
    repos='["emoji-rain", "emoji-selector", "github-canned-responses"]'
    labels='["bug", "enhancement"]'>
</dash-board>
```
And that's literally it:

<img width="731" alt="screen shot 2016-02-12 at 12 58 39 am" src="https://cloud.githubusercontent.com/assets/1369170/13002517/e4a040f4-d123-11e5-8b6f-07f93c86aa64.png">

## Configuring it

By default, the dashboard looks at the repositories under the authenticated
user's username, however it can be configured to use an organization, or even
a mix of repositories from different users and organizations:

```html
<!-- Repositories for a specific organization -->
<dash-board
    organization="polymerelements"
    repos='["paper-input", "paper-button"]'
    labels='["bug", "enhancement"]'>
</dash-board>

<!-- Repositories for a mix of users and organization -->
<dash-board
    full-repo-names
    repos='["notwaldorf/emoji-rain", "notwaldorf/caturday-post", "polymerelements/paper-input", "jquery/jquery"]'
    labels='["bug", "enhancement"]'>
</dash-board>
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
  <dash-board
      github-user="[[user]]"
      repos='["emoji-rain", "emoji-translate"]'
      labels='["bug", "enhancement"]'>
  </dash-board>
  <dash-board
      full-repo-names
      repos='["notwaldorf/caturday-post", "polymerelements/paper-input", "jquery/jquery"]'
      labels='["bug", "enhancement", "help wanted"]'>
  </dash-board>
</template>
```

## <3
Hope this helps you stay on top of issues and PRs!
