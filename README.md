# Simple documentation tool

Inspired from [streamline-doctool](https://github.com/Sage/streamline-doctool)

This package is a simple (minimal) documentation tool for JavaScript modules.

It relies heavily on _markdown_. It works by extracting documentation in markdown syntax from comment blocks. To get started you only need to know one directive:

`/// !doc`: Turns documentation on. Any line that starts with `/// ` (3 slashes followed by a space - may be indented) will be extracted and appended to the documentation file.

# Installation

``` sh
npm install -g markdown-doctool
```

# Usage

``` sh
md-doc [path]
```

# License

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).

