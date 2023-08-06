#!/usr/bin/env node

// Import required libraries
const puppeteer = require('puppeteer');
const parser = require('heapsnapshot-parser');
const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');
const figlet = require('figlet'); // Import figlet for ASCII banner

const argv = require('yargs/yargs')(process.argv.slice(2))
    .option('url', {
        alias: 'u',
        type: 'string',
        describe: 'URL address'
    })
    .option('list', {
        alias: 'l',
        type: 'string',
        describe: 'File containing list of URLs'
    })
    .option('concurrency', {
        alias: 'c',
        type: 'number',
        default: 5,
        describe: 'Number of URLs to fetch concurrently'
    })
    .option('silent', {
        alias: 's',
        type: 'boolean',
        default: false,
        describe: 'Silent mode, does not display the ASCII banner'
    })
    .option('output', {
        alias: 'o',
        type: 'string',
        describe: 'File to save the output'
    })
    .help()
    .argv;

// Function to display the ASCII banner
function displayBanner() {
    figlet.text('HeapTruffle', {
        font: 'Slant',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }, function(err, data) {
        if (err) {
            console.log('Error rendering ASCII banner:', err);
            return;
        }
        console.log('\n');
        console.log(data);
        console.log('\n');
    });
}

// Check for silent mode
if (!argv.silent) {
    // Call the function to display the banner
    displayBanner();
}

// Function to read URLs from file and initialize the tool
if (argv.url) {
    init([new URL(argv.url)]);
} else if (argv.list) {
    const urls = [];
    const fileStream = fs.createReadStream(argv.list);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    rl.on('line', (line) => {
        urls.push(new URL(line));
    });

    rl.on('close', () => {
        init(urls);
    });
} else {
    console.error('You must provide either a --url or a --list option.');
    process.exit(-1);
}

// Function to capture a heap snapshot of a web page
async function getHeapSnapshot(page) {
    const client = await page.target().createCDPSession();
    const chunks = [];

    client.on('HeapProfiler.addHeapSnapshotChunk', ({ chunk }) => {
        chunks.push(chunk);
    });

    await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });

    const snapshot = parser.parse(chunks.join(''));

    return snapshot;
}

// Function to parse paths from the heap snapshot
function parsePathsFromSnapshot(snapshot) {
    const urls = new Set();
    const regex = /(\/[a-zA-Z0-9_.-]+)+|https?:\/\/([^\/\s]+\/)*([^\/\s]+)/g;

    for (let i = 0; i < snapshot.nodes.length; i++) {
        const node = snapshot.nodes[i];
        const matches = node.name.match(regex);

        if (matches != null) {
            matches.forEach((url) => {
                urls.add(url);
            });
        }
    }

    return urls;
}

// Function to output the results to the console or a file
function outputResult(data, domain, outputFile) {
    const sortedData = Array.from(data).sort();
    sortedData.forEach((path) => {
        const outputLine = `[${chalk.green(domain)}] ${path}`;
        console.log(outputLine);
        if (outputFile) {
            fs.appendFileSync(outputFile, outputLine + '\n');
        }
    });
}

// Main function to initialize the tool and perform heap analysis
async function init(urls) {
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const concurrency = argv.concurrency;
        const urlChunks = chunkArray(urls, concurrency);

        const promises = urlChunks.map(async (chunk) => {
            await Promise.all(chunk.map(async (url) => {
                const domain = url.hostname;
                let page;
                try {
                    page = await browser.newPage();
                    page.setDefaultNavigationTimeout(12000);
                    await page.goto(url);

                    const snapshot = await getHeapSnapshot(page);
                    const urls = parsePathsFromSnapshot(snapshot);

                    // Output to console or save to file
                    outputResult(urls, domain, argv.output);
                } catch (error) {
                    // do nothing
                } finally {
                    if (page) {
                        await page.close();
                    }
                }
            }));
        });

        await Promise.all(promises);
        await browser.close();
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        process.exit(-1);
    }
}

// Helper function to split an array into chunks
function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}
