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

/*
 * Displays an ASCII banner using figlet.
 * This function creates an ASCII text banner using figlet and logs it to the console.
 * If there is an error rendering the banner, the error is logged to the console and the function returns.
*/

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

/*
 * Reads URLs from a file and initializes the script.
 * If a single URL is provided as an argument, that URL is used to initialize the script.
 * If a list of URLs is provided, each URL in the list is read from the file, and then the script is initialized with these URLs.
 * If neither a URL nor a list is provided, an error is logged to the console and the process exits with an error code.
 */

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

/*
 * Captures a heap snapshot of a web page using puppeteer.
 * This function creates a new Chrome DevTools Protocol session, then takes a heap snapshot and returns it.
*/

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

/*
 * Parses URLs/paths from a heap snapshot.
 * This function creates a new set of URLs, then iterates over each node in the snapshot.
 * If the node's name contains a URL/paths, they are added to the set.
 * The set of URLs is then returned.
 */

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


/*
 * Outputs the results to the console or a file.
 * This function sorts the data and then logs each item to the console.
 * If an output file is provided, it also writes each item to the file.
 */


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

/*
 * The main function to initialize the script and perform heap analysis.
 * This function launches a new puppeteer browser, divides the URLs into chunks based on the concurrency level,
 * then for each chunk of URLs, it opens a new page, navigates to the URL, takes a heap snapshot, parses the snapshot for URLs,
 * and then outputs the result or saves it to a file.
 * Once all URLs have been processed, the browser is closed.
 * If an error occurs during this process, it is logged to the console and the process exits with an error code.
 */


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

/*
 * Helper function to split an array into chunks.
 * This function creates a new array, then iterates over the input array,
 * adding slices of the input array to the new array based on the provided chunk size.
 * The new array of chunks is then returned.
 */


function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}
