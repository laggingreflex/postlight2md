#!/usr/bin/env node

import Parser from '@postlight/parser';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <url> [options]')
  .demandCommand(1, 'You need to provide a URL to parse')
  .option('format', {
    alias: 'f',
    describe: 'Set content type (html|markdown|text)',
    type: 'string',
    default: 'markdown',
  })
  .option('header', {
    alias: 'H',
    describe: 'Include custom headers in the request',
    type: 'array',
  })
  .option('extend', {
    alias: 'e',
    describe: 'Add a custom type to the response',
    type: 'array',
  })
  .option('extend-list', {
    alias: 'E',
    describe: 'Add a custom type with multiple matches',
    type: 'array',
  })
  .option('add-extractor', {
    alias: 'a',
    describe: 'Add a custom extractor at runtime',
    type: 'string',
  }).argv;

const url = argv._[0];
const options = {};

// Rename format to contentType internally
if (argv.format) {
  options.contentType = argv.format;
}

if (argv.header) {
  options.headers = argv.header.reduce((headers, header) => {
    const [name, value] = header.split('=');
    headers[name] = value;
    return headers;
  }, {});
}

if (argv.extend) {
  options.extend = argv.extend.reduce((extend, ext) => {
    const [name, value] = ext.split('=');
    extend[name] = value;
    return extend;
  }, {});
}

if (argv['extend-list']) {
  options.extendList = argv['extend-list'].reduce((extendList, ext) => {
    const [name, value] = ext.split('=');
    extendList[name] = value;
    return extendList;
  }, {});
}

if (argv['add-extractor']) {
  options.addExtractor = argv['add-extractor'];
}

Parser.parse(url, options)
  .then((result) => console.log(result.content))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
