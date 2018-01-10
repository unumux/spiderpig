# SpiderPig

SpiderPig is a node library used to crawl websites to provide a list or URLs. It also supports logging in to password protected sections

## Installation
- `npm install @unumux/spiderpig`

## Usage

1. Import or require the library
    - `import Crawler from "@unumux/spiderpig";`
    - or `const Crawler = require("@unumux/spiderpig");`
2. Create a crawler instance, and pass in [crawler options](#crawler-options)
    ```
    const crawler = new Crawler({
        url: "http://localhost:3000",
        concurrent: 1,
        delay: 300
    });
    ```
3. Listen for [crawler events](#crawler-events)
    ```
    crawler.on("passing_link_found", (item) => {
        console.log(item);
    });

    crawler.on("finished", () => {
        console.log("Finished!");
    });
    ```
4. Start the crawler
    ```
    crawler.start();
    ```

## Crawler Options

The crawler can receive the following options:

- url (required): string or array of strings for the URL. Currently all links that include this in it will be scanned. So if url is http://localhost:3000, http://localhost:3000/test1/subtest1 and http://localhost:3000/test2/subtest2 would be found. If it was set to http://localhost:3000/test1, only http://localhost:3000/test1/subtest1 would be found.
- concurrent (default: 2): Number of concurrent scans (or threads) to run. It's useful to run 2+, as running a single thread can cause the entire scan to hang if the page takes a long time to load. Just don't use so many that it puts unnecesary load on your web server
- delay (default: 300): Delay between requests. This is useful to prevent putting unnecessary load on the webserver
- login (default: false): If the site you're working on requires a login, the following items should be set. This feature may or may not work, depending on your login system. The key values in the `form` object should map to the `name` properties of the inputs on the login screen.
```
login: {
    url: "https://localhost:3000/my-login-url",
    form: {
        username: "testLogin",
        password: "testPassword",
        RememberMe: true
    }
}
```
- exclude (default: []): Array of exclusion patterns of pages that should not be scanned. These should be RegExp patterns:
```
exclude: [
    new RegExp(".*\.pdf$"),
    new RegExp(".*\.(mp4|mp3|pptx|doc|docx|ppt|mp3|png|jpg|xls|xlsx|ppsx)$"),
    new RegExp(".*Logout.*"),
]
```

## Crawler Events

The following events are availble on the crawler instance

- `queue_updated` - fired when an item is added to the queue. Passes the entire queue as an argument
- `request_start` - fired when an attempt to load a queue item starts. Passes the individual queue item
- `passing_link_found` - fired when a link in the queue loads. Passes the individual queue item (URL) that passed, and an object containing the entire response (in the format of { response })
- `failing_link_found` - fired when a link in the queue fails to load. Passes the individual queue item that failed
- `finished` - fired when the entire queue has been processed
