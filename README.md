# github-triage-dashboard

A Polymer element that will show you a dashboard of statistics about
the open issues and PRs for a given set of GitHub repositories.

It contains two separate elements: the header used in the app, and the actual
results dashboard. This way you can control the authentication, or display
multiple dashboards for the same authenticated user.

Sample use:
```html
<script src="bower_components/webcomponentsjs/webcomponents-lite.js"></script>
<link rel="import" href="dash-board.html">
<link rel="import" href="dash-header.html">

<template is="dom-bind">
  <dash-header
    header="Look at this dashboard go!"
    github-user="{{user}}"></dash-header>
  <dash-board
      github-user="[[user]]"
      repos='["emoji-rain", "emoji-translate", "caturday-post"]'
      labels='["bug", "enhancement"]'>
  </dash-board>
</template>
```

By default, the dashboard looks at the repositories under the authenticated
user's username, however it can be configured to use an organization, or even
a mix of repositories from different users and organizations:

```html
<!-- Repositories for a specific organization -->
<dash-board
    github-user="[[user]]"
    organization="polymerelements"
    repos='["paper-input", "paper-button"]'
    labels='["bug", "enhancement"]'>
</dash-board>

<!-- Repositories for a mix of users and organization -->
<dash-board
    github-user="[[user]]"
    full-repo-names
    repos='["notwaldorf/emoji-rain", "notwaldorf/caturday-post", "polymerelements/paper-input", "jquery/jquery"]'
    labels='["bug", "enhancement"]'>
</dash-board>
```

To use multiple dashboards for the same user, just add more `<dash-board>` elements:

```html
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
      labels='["bug", "enhancement"]'>
  </dash-board>
</template>
```
