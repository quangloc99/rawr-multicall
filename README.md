# Template for project with Typescript

## TODO before use
- `yarn` to install (dev)dependencies
- Change the project name in the `package.json`.
- Remove example files in `src` and `test`.
- Change this file (`README.md`) content.
- Change the variables name (to fit the project):
  + `PROJECT_NAME_NPM_AUTH_TOKEN` in `.yarnrc.yml`.

## Features
### Format with prettier
```sh
yarn format
```
See `.prettierrc` and `.prettierignore` for `prettier` configuration.

### Lint with eslint
```sh
yarn lint           # running lint with fixes
yarn lint:nofix     # running lint but without fixes
```
See `.eslintrc.js` for `eslint` configuration. Additionally, the script
in `package.json`, also contains a `glob` for which files to lint.

This repo uses `typescript-eslint` with recommended rules. Please make sure to
turn off undesired rules.

### Type checking
```sh
yarn typecheck
```

### Building
```sh
yarn build
```

### Github workflow
- Automatically do `yarn lint:nofix` and `yarn typecheck` on `push`.
