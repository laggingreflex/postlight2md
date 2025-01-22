#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import Parser from '@postlight/parser';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import Bluebird from 'bluebird';
import ProgressBar from 'progress';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <url> [options]')
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
  })
  .option('output', {
    alias: 'o',
    describe: 'Specify the output file name',
    type: 'string',
    coerce: (arg) => (arg === '' ? true : arg),
  })
  .option('url-file', {
    alias: 'u',
    describe: 'File containing URLs to process',
    type: 'string',
  })
  .option('concurrency', {
    alias: 'c',
    describe: 'Number of concurrent requests',
    type: 'number',
    default: 1,
  })
  .check((argv) => {
    if (!argv._.length && !argv.urlFile) {
      throw new Error(
        'You need to provide a URL to parse or a file containing URLs'
      );
    }
    return true;
  }).argv;

const url = argv._[0];
const options = {};

// Rename format to contentType internally
if (argv.format) {
  options.contentType = argv.format;
  argv.contentType = argv.format;
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

async function processUrl(url, options, bar) {
  try {
    const result = await Parser.parse(url, options);
    const content = result.content;
    if (argv.output !== false) {
      let filename;
      if (argv.output === true || argv.urlFile) {
        const title = result.title || 'output';
        filename =
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '.md';
      } else {
        filename = argv.output;
      }
      fs.writeFileSync(path.resolve(process.cwd(), filename), content);
      console.log(`Content written to ${filename}`);
    } else {
      console.log(content);
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (bar) bar.tick(); // Update the progress bar
  }
}

async function processUrlsFromFile(filePath, concurrency, options) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const urls = fileContent.split(/\r?\n/).filter(Boolean);
  const bar = new ProgressBar('Processing [:bar] :current/:total', {
    total: urls.length,
  });

  let allContent = '';

  await Bluebird.map(
    urls,
    async (url) => {
      try {
        // console.log(`options:`, options)
        const result = await Parser.parse(url, options);
        // const result = await Parser.parse(url, options);
        // allContent += result.content + '\n\n';
        allContent += `\n\n---\n---\n---\n# [${result.title}](${url})\n\n${result.content}\n`;
      } catch (error) {
        console.error(`Error processing ${url}: ${error.message}`);
      } finally {
        bar.tick();
      }
    },
    { concurrency }
  );

  if (argv.output !== false) {
    const outputFile = argv.output === true ? 'output.md' : argv.output;
    fs.writeFileSync(path.resolve(process.cwd(), outputFile), allContent);
    console.log(`Content written to ${outputFile}`);
  } else {
    console.log(allContent);
  }
}

async function main() {
  if (argv.urlFile) {
    argv.output = argv.output !== false ? true : false;
    await processUrlsFromFile(argv.urlFile, argv.concurrency, argv);
  } else {
    await processUrl(argv._[0], argv);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
