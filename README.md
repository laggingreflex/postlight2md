# postlight2md

`postlight2md` is a command-line tool that uses the [Postlight Parser](https://www.npmjs.com/package/@postlight/parser) to extract content from web pages and convert it into different formats such as HTML, Markdown, or plain text.

## Installation

To install `postlight2md`, you need to have Node.js installed. Then, you can install it globally using npm:

```sh
npm install -g postlight2md
```

## Usage

You can use `postlight2md` by providing a URL to parse. The default output format is Markdown.

```sh
postlight2md <url> [options]
```

### Options

- `-f, --format <format>`: Set content type (html|markdown|text). Default is `markdown`.
- `-H, --header <header>`: Include custom headers in the request. Can be used multiple times.
- `-e, --extend <extend>`: Add a custom type to the response. Can be used multiple times.
- `-E, --extend-list <extend-list>`: Add a custom type with multiple matches. Can be used multiple times.
- `-a, --add-extractor <extractor>`: Add a custom extractor at runtime.

### Examples

Convert a web page to Markdown:

```sh
postlight2md https://example.com
```

Convert a web page to HTML:

```sh
postlight2md https://example.com -f html
```

Include custom headers in the request:

```sh
postlight2md https://example.com -H "Authorization=Bearer token"
```

Add a custom type to the response:

```sh
postlight2md https://example.com -e "customType=value"
```

Add a custom extractor at runtime:

```sh
postlight2md https://example.com -a "./path/to/extractor.js"
```

## License

This project is licensed under the MIT License.

---

Made with ~~❤️~~ impatience and AI 🤖.
