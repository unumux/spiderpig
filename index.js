const url = require("url");
const {EventEmitter} = require("events");

const request = require("request-promise");
const cheerio = require("cheerio");
const _ = require("lodash");

const defaultOpts = {
    login: false,
    delay: 300,
    concurrent: 2,
    exclude: []
}

class SpiderPigCrawler extends EventEmitter {
    constructor(opts) {
        super();
        this.opts = Object.assign({}, defaultOpts, opts);
        this.jar = request.jar();
        this.request = request.defaults({ jar: this.jar });
        
        if(!this.opts.url) {
            throw "URL is required";
        }

        this.queue = Array.isArray(this.opts.url) ? this.opts.url : [this.opts.url];
        this.allDiscoveredUrls = this.queue;

        this.passLinks = [];
        this.failLinks = [];
    }

    async start() {
        if(this.opts.login) {
            await this.login();
        }

        const workers = [];

        for(var i = 0; i < this.opts.concurrent; i++) {
            workers.push(this.startWorker());
            await delay(this.opts.delay / this.opts.concurrent);
        }

        await Promise.all(workers);
        this.emit("finished");
    }

    async startWorker() {
        while(this.queue.length > 0) {
            await this.processQueueItem(this.queue.pop());
            await delay(this.opts.delay);
        }
    }

    async processQueueItem(queueItem) {
        this.emit("request_start", queueItem);
        if(queueItem) {
            try {
                const response = await this.request.get(queueItem);
                this.passLinks.push(queueItem);
                this.emit("passing_link_found", queueItem);
                this.discoverLinks(response, queueItem);            
            } catch(err) {
                if(err.statusCode === 404) {
                    this.failLinks.push(queueItem);
                    this.emit("failing_link_found", queueItem);
                }
            }
        }
    }

    async discoverLinks(html, queueItem) {
        const $ = cheerio.load(html);
        const allLinks = $("a").map((i, el) => {
            return $(el).attr("href");
        }).toArray();


        if(allLinks && allLinks.length > 0) {            
            let newLinks = allLinks.map(mapToAbsoluteUrl.bind(null, queueItem)).filter((link) => {
                for(var i=0; i<this.opts.exclude.length; i++) {
                    if(link.match(this.opts.exclude[i])) {
                        return false
                    }
                }
                
                return link && link.indexOf(this.opts.url) === 0;
            });

            newLinks = _(newLinks)
                        .uniq()
                        .difference(this.allDiscoveredUrls)
                        .value();

            if(newLinks.length > 0) {
                this.allDiscoveredUrls = this.allDiscoveredUrls.concat(newLinks);
                this.queue = this.queue.concat(newLinks);
                this.emit("queue_updated", this.queue);
            }
        }
    }

    async login() {
        try {
            await this.request.post(this.opts.login.url, { form: this.opts.login.form })
        } catch(err) {}
    }

    async linksFilter(link) {
        const urlObj = url.parse(link);
        return link;
    }
}

// function mapToUrlObj(urlString) {
//     return url.parse(urlString);
// }

function mapToAbsoluteUrl(baseUrl, newUrl) {
    const absUrl = url.resolve(baseUrl, newUrl);
    const urlObj = url.parse(absUrl);
    urlObj.href = urlObj.href.replace(urlObj.search, "").replace(urlObj.hash, "");
    return urlObj.href;
}

function delay(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

module.exports = SpiderPigCrawler;