# i18n-cli

Command-line interface to extract and localize strings added to your code with
[i18n-kit](https://github.com/rodu30/i18n-kit/).

## Prerequisites

[Node.js](https://nodejs.org/en/)

## Installation

Add CLI to your project:

```bash
$ npm install --save git+ssh://git@github.com:rodu30/i18n-cli.git
```

### Run locally

All executables for a project are saved in `<your app>/node_module/.bin`. Run the local installation
of the **i18n-cli** like this:

```bash
$ node_modules/.bin/i18n [options] [command]
```

### Install globally

It is convenient to install the CLI globally to use it like any other command line tool:

```bash
$ cd node_modules/i18n-cli && npm install -g
```

Now the `i18n` commands can be called from everywhere.

### Add to scripts

In order to automize the tasks, add your preferred **i18n-cli** commands to the script in your
project's `package.json`.

Example:

```json
{
  "scripts": {
    "extract":
      "node_modules/.bin/i18n ext -o src en-US src/messages && node_modules/.bin/i18n merge src/messages/en-US.json src/messages"
  }
}
```

## Usage

Basic usage:

```bash
$ i18n [options] [command]
```

To get more information:

```bash
$ i18n -h
```

or:

```bash
$ i18n [command] -h
```

### Extract messages

If you have passed some default text to the translation function of the `i18n-kit` in your project's
code, you can extract this text (and options passed with the strings) with the `extract` command and
write it to a JSON file. From there you can upload it to a translation platform or perform further
actions (see below).

> Note: Make sure you have passed the text directly to the function and not via a reference. The
> script scans the code for specific markers (the function name) and returns the arguments. However
> since the code is read as a simple string it is not interpreted and the script cannot resolve
> variables.

#### Arguments

* `source path`: directory where the code sits
* `default locale`: name of the locale or language of the default text
* `target path` (optional): directory where to save the messages-file (default is current directory;
  when file with the same name exists it will be overwritten)
* Options:

  * `--no-output`: don't show extracting progress
  * `--func-name <function name>`: custom marker to search for

#### Examples

```bash
$ i18n extract src en-US src/i18n
[1/3]  Reading files...
[2/3]  Extracting from src/App.js...
...found 3
[2/3]  Extracting from src/index.js...
...found 0
[2/3]  Extracting from src/i18n/index.js...
...found 0
[2/3]  Extracting from src/registerServiceWorker.js...
...found 0
[3/3]  Writing file...
Success I18n messages saved to "src/i18n/en-US.json"!
```

```bash
$ i18n ext -o src en-US src/i18n
Success I18n messages saved to "src/i18n/en-US.json"!
```

Results in:

```json
{
  "this_is_{num1}_test_for_{num2}.": {
    "message": "This is {num1} test for {num2}.",
    "contexts": [{ "file": "src/App.js", "line": 55, "column": 6 }]
  },
  "this_is_another_test.": {
    "message": "This is another test.",
    "contexts": [
      { "file": "src/App.js", "line": 61, "column": 22, "description": "foo" },
      { "file": "src/App.js", "line": 67, "column": 33, "description": "bar" }
    ]
  }
}
```

### Merge messages

If the default text is persisted, you want to localize your app and add translation for your
supported languages and locales. In order to make this easier you can use the `merge` command. The
script reads your current defaults and compares them to the existing translations and checks if
translations are missing or are no longer used in the source code. Alternatively the script creates
a new empty translation template.

#### Arguments

* `source file`: file name (and path) of the defaults
* `target path`: directory where to search for the translation file(s)
* `target file` (optional): additional file name to look for or to create in the path (use if you
  want to merge a specific file or if you want to create a new template)
* Options:
  * `--report`: display a report after merging

#### Examples

Basic:

```bash
$ i18n merge src/i18n/en-US.json src/i18n
Success I18n messages merged with "src/i18n/de-DE.json"!
Success I18n messages merged with "src/i18n/en-GB.json"!
Success I18n messages merged with "src/i18n/de-CH.json"!
Success I18n messages merged with "src/i18n/fr-FR.json"!
```

With report:

```bash
$ i18n merge -r src/i18n/en-US.json src/i18n
╔═════════════════╤═══════╤═════════╤════════╗
║                 │ Total │ Missing │ Unused ║
╟─────────────────┼───────┼─────────┼────────╢
║ en-US (default) │ 2     │ /       │ /      ║
╟─────────────────┼───────┼─────────┼────────╢
║ de-CH           │ 2     │ 2       │ 0      ║
╟─────────────────┼───────┼─────────┼────────╢
║ en-GB           │ 2     │ 2       │ 0      ║
╟─────────────────┼───────┼─────────┼────────╢
║ de-DE           │ 3     │ 0       │ 1      ║
╟─────────────────┼───────┼─────────┼────────╢
║ fr-FR           │ 2     │ 2       │ 0      ║
╚═════════════════╧═══════╧═════════╧════════╝
Success I18n messages merged with "src/i18n/fr-FR.json"!
Success I18n messages merged with "src/i18n/de-CH.json"!
Success I18n messages merged with "src/i18n/de-DE.json"!
Success I18n messages merged with "src/i18n/en-GB.json"!
```

Create new:

```bash
$ i18n merge src/i18n/en-US.json src/i18n de-CH.json
Success I18n messages saved to new locale "src/i18n/de-CH.json"!
```

```json
{
  "this_is_{num1}_test_for_{num2}.": {
    "message": null,
    "contexts": [{ "file": "src/App.js", "line": 55, "column": 6 }],
    "flag": "MISSING"
  },
  "this_is_another_test.": {
    "message": null,
    "contexts": [
      { "file": "src/App.js", "line": 61, "column": 22, "description": "foo" },
      { "file": "src/App.js", "line": 67, "column": 33, "description": "bar" },
      { "file": "src/App.js", "line": 71, "column": 34, "description": "bar" }
    ],
    "flag": "MISSING"
  }
}
```

## Development

During development it's convenient to make the symlink on our path point to the `index.js` we're
actually working on.

Go to the directory with the source code and:

```bash
$ npm link
```
