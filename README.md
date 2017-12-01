# i18n-cli

Command-line interface to extract strings added with
[i18n-kit](https://github.com/rodu30/i18n-kit/).

## Prerequisites

* node ^8.9.0

## Installation

Add CLI to your project:

```bash
$ yarn add git+ssh://git@github.com:rodu30/i18n-scanner.git
```

Then install CLI to your path:

```bash
$ cd node_modules/i18n-scanner && npm install -g
```

Now you are good to go.

## Usage

Type this to get more infos:

```bash
$ i18n -h
```

### Arguments

* source path
* target path
* marker
* options:

  * ignore namespace
  * show newest

  ...

## Development

During development it's convenient to make the symlink on our path point to the `index.js` we're
actually working on.

Go to the directory with the source code and:

```bash
$ npm link
```
