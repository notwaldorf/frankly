# Polyclean

Basic gulp plugins for cleaning html.

## API

- `cleanJsComments`
    - Remove javascript comments
- `leftAlignJs`
    - Remove javascript comments and leading whitespace
- `uglifyJs`
    - Run javascript through `uglify`
    - Pass options with `uglifyJs(options)`
      - `options.fromString` is always true
- `cleanCss`
    - Remove extra whitespace in CSS
