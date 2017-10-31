let Crawler = require("crawler");
let SolrNode = require('solr-node');
let url = require('url');
let fs = require('fs');
let solr_config = require('./solr_config.json');

const wikibooksRegex = /\/wiki\/Java_Programming(.*)$/g;
const oracleRegex = /\/javase\/Java_Programming(.*)$/g;
const wikibooksBaseDomain = "https://en.wikibooks.org";
const newLineRegex = /\n/g

const solrBaseUrl = "http://ec2-34-213-252-195.us-west-2.compute.amazonaws.com:8983/solr/demo/update";

let visitedURLs = [];

let client = new SolrNode(solr_config);

client.delete("*:*", function(err, result) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Response:', result.responseHeader);
});

function wikiBooksCallback(error, res, done) {
    if (error) {
        console.log(error);
    } else {
        try {
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
                            link: res.request.uri.href,
                            title: title,
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
                        link: res.request.uri.href,
                        title: title,
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
            }
        } catch (e) {
            console.log(e);
        }
    }

    done();
}

function oracleCallback(error, res, done) {
    if (error) {
        console.log(error);
    } else {
        let $ = res.$;
        try {
            console.log($("title").text());
            let title = "";
            let content = "";
            let contentHeader = "";
            let tempElements = [];
            let parts = [];

            $("#PageContent").children().each(function(i, childElement) {
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
                                contentHeader = $(tempElements[i]).text().trim();
                            }
                            continue;
                        }
                        content += $(tempElements[i]).text().replace(newLineRegex, "").trim();
                    }

                    if (content.length > 0) {
                        let part = {
                            link: res.request.uri.href,
                            title: title,
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
                        link: res.request.uri.href,
                        title: title,
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
            }

            let links = $('#PageContent a');
            let oracleBaseDomain = res.request.uri.href;
            let linkToExplore = "";

            if (oracleBaseDomain.includes(".html")) {
                oracleBaseDomain = oracleBaseDomain.split("/").slice(0, oracleBaseDomain.split("/").length - 1).join("/") + "/";
            }

            $(links).each(function(i, link) {
                if (oracleBaseDomain != undefined && $(link).prop('href') != undefined) {
                    linkToExplore = url.resolve(oracleBaseDomain, $(link).prop('href'));
                    if (!visitedURLs.includes(linkToExplore)) {
                        visitedURLs.push(linkToExplore);
                        c.queue({
                            uri: linkToExplore,
                            callback: oracleCallback
                        });
                    }
                }
            });

        } catch (e) {
            console.log(e);
        }
    }

    done();
}

let c = new Crawler({
    rateLimit: 1000,
    callback: function(error, res, done) {
        if (error) {
            console.log(error);
        } else {
            let $ = res.$;
            console.log($("title").text());
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
                if (wikibooksRegex.test($(link).prop('href'))) {
                    if (!visitedURLs.includes(wikibooksBaseDomain + $(link).prop('href'))) {
                        visitedURLs.push(wikibooksBaseDomain + $(link).prop('href'));
                        c.queue({
                            uri: wikibooksBaseDomain + $(link).prop('href'),
                            callback: wikiBooksCallback
                        });
                    }
                }
            });
        }

        done();
    }
});

c.queue({
    uri: 'https://docs.oracle.com/javase/tutorial/',
    callback: function(error, res, done) {
        if (error) {
            console.log(error);
        } else {
            let $ = res.$;
            console.log($("title").text());
            let links = $('#TutBody a');
            let oracleBaseDomain = res.request.uri.href;

            if (oracleBaseDomain.includes(".html")) {
                oracleBaseDomain = oracleBaseDomain.split("/").slice(0, oracleBaseDomain.split("/").length - 1).join("/") + "/";
            }

            $(links).each(function(i, link) {
                if (oracleBaseDomain != undefined && $(link).prop('href') != undefined) {
                    linkToExplore = url.resolve(oracleBaseDomain, $(link).prop('href'));
                    if (!visitedURLs.includes(linkToExplore)) {
                        visitedURLs.push(linkToExplore);
                        c.queue({
                            uri: linkToExplore,
                            callback: oracleCallback
                        });
                    }
                }
            });
        }

        done();
    }
});
