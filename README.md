<h1 align="center">
    HeapTruffle
  <br>
</h1>

<h4 align="center">Mine URLs from Heap Snapshot for fun and profit </h4>


<p align="center">
  <a href="#install">🏗️ Install</a>  
  <a href="#usage">⛏️ Usage</a> 
  <a href="#how-it-works">💡 How it Works</a>  
  <a href="#inspiration">💡 Inspiration</a> 
  <br>
</p>



# Install
```sh
git clone https://github.com/devanshbatham/heaptruffle
cd heaptruffle
npm install
npm link
```

# Usage

To run HeapTruffle, you can use the following command:

```sh
heaptruffle --url https://example.com
```

or

```sh
heaptruffle --list urls.txt
```

- Increase concurrency to fetch URLs faster:

```sh
heaptruffle --list urls.txt --concurrency 10
```

- Save the output to a file (output.txt):

heaptruffle --url https://example.com --output output.txt
```

- Use silent mode to suppress the ASCII banner:

```
heaptruffle --url https://example.com --silent
```
## Options

| Option       | Alias | Type     | Description                                  |
|--------------|-------|----------|----------------------------------------------|
| `--url`      | `-u`  | `string` | URL address                                  |
| `--list`     | `-l`  | `string` | File containing list of URLs                 |
| `--concurrency` | `-c`  | `number` | Number of URLs to fetch concurrently (default: 5) |
| `--silent`   | `-s`  | `boolean`| Silent mode, does not display the ASCII banner (default: false)|
| `--output`   | `-o`  | `string` | File to save the output                       |
| `--help`     | `-h`  |          | Show help                                    |



# How it Works

HeapTruffle uses Puppeteer, a headless browser automation library, to load web pages and capture heap snapshots of the web pages' memory. These heap snapshots are then parsed using the `heapsnapshot-parser` library, allowing HeapTruffle to extract URLs/endpoints from it.

The tool takes either a single URL or a file containing a list of URLs as input. It fetches each URL concurrently to speed up the process. For each URL, HeapTruffle loads the web page, captures a heap snapshot, and then performs analysis to extract relevant paths from the snapshot. It identifies the URLs and paths accessed during the page's execution and outputs them to the console or a specified output file.

## Inspiration
This tool was inspired by the project [extract-relative-url-heapsnapshot](https://github.com/smiegles/extract-relative-url-heapsnapshot) by [smiegles](https://github.com/smiegles). I just improved it in my way, and extended it's functionality (concurrency, support for multiple URLs, pretty output, and ability to save the results in a file, etc). 