#!/usr/bin/env node

const program = require('commander');
const ora = require('ora');
const search = require('../lib/search');

program.version(require('../package').version);

program
    .command('search')
    .alias('s')
    .description('搜索下载')
    .option('-p, --page [number]', 'page', 1)
    .option('-c, --count [number]', 'page size', 10)
    .action(search);

program
    .command('download <query> [type]')
    .alias('d')
    .description('execute the given remote cmd')
    .action(function (query, type, options) {
        console.log('options', options);
    });

program.parse(process.argv);
