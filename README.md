# github-triage-dashboard

A Polymer element that will show you a dashboard of statistics about
the open issues and PRs for a given set of GitHub repositories.

Sample use:
```html
<dash-board
    header="Look at this dashboard go!"
    repos='["emoji-rain", "emoji-translate", "notwaldorf/caturday-post"]'
    labels='["bug", "enhancement"]'>
</dash-board>
```

By default, the dashboard looks at the repositories under the authenticated
user's username, however it can be configured to use an organization, or even
a mix of repositories from different users and organizations:

```html
<!-- Repositories for a specific organization -->
<dash-board
    header="Some Polymer Elements"
    organization="polymerelements"
    repos='["paper-input", "paper-button"]'
    labels='["bug", "enhancement"]'>
</dash-board>

<!-- Repositories for a mix of users and organization -->
<dash-board
    header="Things from all over the place"
    full-repo-names
    repos='["notwaldorf/emoji-rain", "notwaldorf/caturday-post", "polymerelements/paper-input", "jquery/jquery"]'
    labels='["bug", "enhancement"]'>
</dash-board>
```
