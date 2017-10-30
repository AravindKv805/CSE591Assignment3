let Crawler = require("crawler");
let SolrNode = require('solr-node');
let url = require('url');
let fs = require('fs');

const myRegex = /\/wiki\/Java_Programming(.*)$/g;
const baseDomain = "https://en.wikibooks.org";
const newLineRegex = /\n/g

const solrBaseUrl = "http://ec2-34-213-252-195.us-west-2.compute.amazonaws.com:8983/solr/demo/update";

let visitedURLs = [];

let client = new SolrNode({
    host: 'ec2-34-213-252-195.us-west-2.compute.amazonaws.com',
    port: '8983',
    core: 'mycore',
    protocol: 'http',
    debugLevel: 'ERROR'
});

client.delete("*:*", function(err, result) {
   if (err) {
      console.log(err);
      return;
   }
   console.log('Response:', result.responseHeader);
});

let c = new Crawler({
    rateLimit: 1000,
    callback: function(error, res, done) {
        if (error) {
            console.log(error);
        } else {
            let $ = res.$;
            let title = "";
            let content = "";
            let contentHeader = "";
            let tempElements = [];
            let parts = [];

            $(".mw-parser-output").children().each(function(i, childElement) {
                if ($(childElement).hasClass(".wikitable") || $(childElement).hasClass(".noprint")) {
                    if ($(childElement).hasClass(".noprint")) {
                        title = $(childElement).find("b").text();
                    }
                    return;
                }
                if ($(childElement).is(':header')) {
                    content = "";
                    contentHeader = "";
                    for (let i = 0; i < tempElements.length; i++) {
                        if (i == 0) {
                            if ($(tempElements[i]).text().trim().length > 50) {
                                contentHeader = title;
                            } else {
                                contentHeader = $(tempElements[i]).text().replace("[edit]", "").trim();
                            }
                            continue;
                        }
                        content += $(tempElements[i]).text().replace(newLineRegex, "").trim();
                    }

                    if (content.length > 0) {
                        let part = {
                            contentHeader: contentHeader,
                            content: content
                        };

                        parts.push(part);
                        client.update(part, function(err, result) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            console.log('Response:', result.responseHeader);
                        });
                    }

                    tempElements = [];
                }

                tempElements.push(childElement);
            });
            if (tempElements.length > 0) {
                content = "";
                contentHeader = "";
                for (let i = 0; i < tempElements.length; i++) {
                    if (i == 0) {
                        if ($(tempElements[i]).text().trim().length > 50) {
                            contentHeader = title;
                        } else {
                            contentHeader = $(tempElements[i]).text().replace("[edit]", "").trim();
                        }
                        continue;
                    }
                    content += $(tempElements[i]).text().replace(newLineRegex, "").trim();
                }

                if (content.length > 0) {
                    let part = {
                        contentHeader: contentHeader,
                        content: content
                    };

                    parts.push(part);
                }
            }
        }

        done();
    }
});

c.queue({
    uri: 'https://en.wikibooks.org/wiki/Java_Programming',
    callback: function(error, res, done) {
        if (error) {
            console.log(error);
        } else {
            let $ = res.$;
            let links = $('a'); //jquery get all hyperlinks
            $(links).each(function(i, link) {
                if (myRegex.test($(link).attr('href'))) {
                    if (!visitedURLs.includes(baseDomain + $(link).attr('href'))) {
                        visitedURLs.push(baseDomain + $(link).attr('href'));
                        // console.log($(link).text() + ':\n  ' + baseDomain + $(link).attr('href'));
                        c.queue(baseDomain + $(link).attr('href'));
                    }
                }
            });
        }
        done();
    }
});
