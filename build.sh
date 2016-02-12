org=${1:-"notwaldorf"}
repo=${2:-"frankly"}

polybuild index.html
echo js:   `gzip -c index.build.js | wc -c`
echo html: `gzip -c index.build.html | wc -c`

rm -rf deploy
git clone -b gh-pages --single-branch git@github.com:$org/$repo.git deploy

mv index.build.html deploy/index.html
mv index.build.js deploy

pushd deploy >/dev/null
git add -A .
git commit -am 'update gh-pages'
git push -u origin gh-pages:gh-pages -f
popd >/dev/null
