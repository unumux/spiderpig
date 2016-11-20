const http = require('http');
const ecstatic = require('ecstatic');
const _ = require("lodash");
const {expect} = require("chai");
 
const Crawler = require("../index.js");

http.createServer(
  ecstatic({ root: __dirname + '/fixtures' })
).listen(8080);
 
describe("SpiderPigCrawler", function() {
    this.timeout(15000);

    const passLinks = [ 
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8080/test5.html',
        'http://127.0.0.1:8080/test3.html',
        'http://127.0.0.1:8080/test4.html',
        'http://127.0.0.1:8080/test2.html',
        'http://127.0.0.1:8080/test1.html',
        'http://127.0.0.1:8080/index.html' 
    ];

    const failLinks = [
        'http://127.0.0.1:8080/test6.html'
    ];

    describe("1 concurrent; 10ms delay", function() {
        standardTests({
            concurrent: 1,
            delay: 10
        }, passLinks, failLinks);
    });

    describe("2 concurrent; 100ms delay", function() {
        standardTests({
            concurrent: 2,
            delay: 100
        }, passLinks, failLinks);
    });

    describe("4 concurrent; 1s delay", function() {
        standardTests({
            concurrent: 4,
            delay: 1000
        }, passLinks, failLinks);
    });

    describe("6 concurrent; 3s delay", function() {
        standardTests({
            concurrent: 6,
            delay: 3000
        }, passLinks, failLinks);
    });

    describe("exclude passlink", function() {
        const passLinksWithoutTest5 = _.difference(passLinks, ['http://127.0.0.1:8080/test5.html']);

        standardTests({
            exclude: [
                new RegExp(".*test5.html")
            ]
        }, passLinksWithoutTest5, failLinks);
    });

    describe("exclude faillink", function() {
        const failLinksWithoutTest6 = _.difference(failLinks, ['http://127.0.0.1:8080/test6.html']);

        standardTests({
            exclude: [
                new RegExp(".*test6.html")
            ]
        }, passLinks, failLinksWithoutTest6);
    });
    
    describe("exclude passlink and faillink", function() {
        const passLinksWithoutTest5 = _.difference(passLinks, ['http://127.0.0.1:8080/test5.html']);        
        const failLinksWithoutTest6 = _.difference(failLinks, ['http://127.0.0.1:8080/test6.html']);

        standardTests({
            exclude: [
                new RegExp(".*test5.html"),
                new RegExp(".*test6.html")
            ]
        }, passLinksWithoutTest5, failLinksWithoutTest6);
    });
});


const defaultConfig = {
    url: "http://127.0.0.1:8080"
}

function standardTests(passedConfig, passLinks, failLinks) {
    let crawler;
    
    before(function(done) {
        const config = Object.assign({}, defaultConfig, passedConfig);

        crawler = new Crawler(config);

        crawler.on("finished", done);
        crawler.start();
    });

    it("should store all passing pages in a passlinks property", function() {
        expect(crawler.passLinks).to.have.members(passLinks);
    });

    it("should store all failing pages in a failLinks property", function() {
        expect(crawler.failLinks).to.deep.have.members(failLinks);
    });
}