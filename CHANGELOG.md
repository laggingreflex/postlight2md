# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0]

### Added

- Added support for processing URLs from a file with specified concurrency.
- Added `-u, --url-file` option to specify a file containing URLs to process.
- Added `-c, --concurrency` option to set the number of concurrent requests.

### Changed

- Updated the `main` function to handle URL files and concurrency.
- Improved error handling and logging.

### Fixed

- Fixed issue with output file name generation when using the `-o` option.

## [0.2.0]

### Added

- Output option to specify filename for saved content.

## [0.1.0]

### Added

- Initial implementation of URL parser with command-line options.
- README with installation instructions, usage, and options for `postlight2md`.
- Version badge to README.
