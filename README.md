This is a fork of [Quartz 4](https://quartz.jzhao.xyz/) with some customisations.

## Hosting content in a dedicated project

To decouple the Quartz infrastructure (this repository or [the upstream one](https://github.com/jackyzha0/quartz)) from the actual content:

- create a repository and put content in a `content/` subdirectory (following https://quartz.jzhao.xyz/authoring-content)

- (optionally) put a custom `quartz.config.ts` in the root of the repository

You can then have a Github workflow (say in `.github/workflows/publish.yml`) with something like

```yml
name: Build Site with Quartz
on:
  push:
    branches: ["main"]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build_site:
    name: Build site
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:

      # We configure Quartz to extract dates from the git history.
      # We thus have to bring it into our repo to keep the git history.

    - name: Checkout
      uses: actions/checkout@v4

    - name: Checkout ftschindler/quartz
      uses: actions/checkout@v4
      with:
        repository: ftschindler/quartz
        ref: v4
        path: tmp

    - name: Install Quartz infrastructure
      run: |
        cd tmp
        cp -r \
          ./*.ts \
          ./*.json \
          .node-version \
          .npmrc \
          .prettierignore \
          .prettierrc \
          quartz \
          ../

    - name: Use custom Quartz settings
      run: |
        git checkout -- quartz.config.ts

    - name: Install Quartz
      run: |
        npm i

    - name: Build the site
      run: |
        npx quartz build -o _site -v

    - name: Upload html artifact
      uses: actions/upload-pages-artifact@v3

  deploy_site:
    name: Deploy site (on push to main)
    runs-on: ubuntu-24.04
    needs: [build_site]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    permissions:
      pages: write          # to deploy to Pages
      id-token: write       # to verify the deployment originates from an appropriate source
    steps:

    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4.0.5

```
