let Crawler = require("crawler");
let url = require('url');
let fs = require('fs');

const myRegex = /\/wiki\/Java_Programming(.*)$/g;
const baseDomain = "https://en.wikibooks.org";
const newLineRegex = /\n/g

let visitedURLs = [];

let c = new Crawler({
    maxConnections: 10,

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

            if (parts.length > 0) {
                // console.log(parts);
                // TODO: POST parts into Solr
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
