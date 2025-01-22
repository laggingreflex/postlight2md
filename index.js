#!/usr/bin/env node

import Path from 'node:path';
import URL from 'node:url';
import fs from 'fs-extra';
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

if (argv.format) {
  argv.contentType = argv.format;
}

if (argv.header) {
  argv.headers = argv.header.reduce((headers, header) => {
    const [name, value] = header.split('=');
    headers[name] = value;
    return headers;
  }, {});
}

if (argv.extend) {
  argv.extend = argv.extend.reduce((extend, ext) => {
    const [name, value] = ext.split('=');
    extend[name] = value;
    return extend;
  }, {});
}

if (argv['extend-list']) {
  argv.extendList = argv['extend-list'].reduce((extendList, ext) => {
    const [name, value] = ext.split('=');
    extendList[name] = value;
    return extendList;
  }, {});
}

if (argv['add-extractor']) {
  argv.addExtractor = argv['add-extractor'];
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function processUrl(url, options) {
  const result = await Parser.parse(url, options);
  result.url = url;
  return result;
}

async function processUrls(urls, options) {
  const bar = new ProgressBar('Processing [:bar] :current/:total :log', {
    total: urls.length,
  });
  return Bluebird.map(
    urls,
    (url) =>
      processUrl(url, options)
        .catch((error) => ({ url, error }))
        .finally(() =>
          bar.tick({
            log: `Processed ${url}`,
          })
        ),
    { concurrency: options.concurrency }
  );
}

async function processUrlsFromFile(filePath, options) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const urls = fileContent
    .split(options.separator || /[\n\r]+/g)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http'))
    .filter(Boolean);

  return processUrls(urls, options);
}

async function main() {
  const { _: urls, ...options } = argv;
  let results;
  try {
    if (options.urlFile) {
      results = await processUrlsFromFile(options.urlFile, options);
    } else {
      results = await processUrls(urls, options);
    }

    const content = results
      .map(formatted)
      .join('\n\n\n----------\n----------\n\n');

    if (results.length <= 1) {
      if (options.output) {
        const outputFile =
          options.output === true ? 'output.md' : options.output;
        fs.writeFileSync(
          Path.resolve(process.cwd(), outputFile),
          results[0].content
        );
        const size = ((results[0].content.length * 3) / 1024).toFixed(0);
        console.log(`Content (${size}k) written to ${outputFile}`);
      } else {
        console.log(results[0].content);
      }
    } else {
      if (options.output) {
        if (typeof options.output === 'string') {
          const outputFile = options.output;
          fs.writeFileSync(Path.resolve(process.cwd(), outputFile), content);
          const size = ((content.length * 3) / 1024).toFixed(0);
          console.log(`Content (${size}k) written to ${outputFile}`);
        } else {
          for (const result of results) {
            const filename =
              (
                result.title ||
                ((url) => {
                  url = URL.parse(url);
                  return `${url.hostname
                    .split('.')
                    .slice(0, -1)
                    .join('.')
                    .replace('www.', '')}_${url.pathname}`;
                })(result.url)
              )
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') + '.md';
            fs.writeFileSync(
              Path.resolve(process.cwd(), filename),
              formatted(result)
            );
            const size = ((result.content?.length ?? 0 * 3) / 1024).toFixed(0);
            console.log(`Content (${size}k) written to ${filename}`);
          }
        }
      } else {
        console.log(content);
      }
    }
    return { content, results };
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

function replacer(key, value) {
  if (
    ['content', 'excerpt', 'url', 'domain', 'direction'].includes(key) ||
    !value
  ) {
    return undefined;
  } else {
    return value;
  }
}

function formatted(result) {
  if (result.error) {
    return `Error processing ${result.url}: ${result.error.message}`;
  }
  const stringified = JSON.stringify(result, replacer, 2);
  return [
    `${result.title}\n`,
    `${result.url}\n`,
    // `[${r.title}](${r.url})\n`,
    '```json',
    stringified,
    '```\n',
    result.content || result.excerpt || '',
  ].join('\n');
}
