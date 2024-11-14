import { RequestMaker } from "./index.js";
import ejs from "ejs";
import express from "express";
import { join } from "path";
import { readFileSync } from "fs";

const { API_ADDR } = process.env;
const PER_PAGE = 20;

const rm = new RequestMaker(API_ADDR);

const ejsPath = (...paths) => join(import.meta.dirname, "templates", ...paths);
const loadEjs = (data, ...paths) => {
    const filepath = ejsPath(...paths);
    return ejs.render(readFileSync(filepath, "utf-8"), data, {
        "filename": filepath
    });
};

const app = express();
app.use(express.static(join(import.meta.dirname, "static")));

app.get("/", (_req, res) => {
    res.status(200).send(loadEjs({
        "title": "LibRuStore"
    }, "index.ejs"));
});

app.get("/search", async (req, res) => {
    const query = req.query.query;
    let page = parseInt(req.query.page);
    if(req.query.sub1) page--;
    // TODO: move these to a separate function
    if(page === null || page === undefined || page === NaN) return res.status(400).send(loadEjs({
        "title": "Error",
        "error": "Bad request"
    }, "error.ejs"));
    try {
        const result = await rm.get(`/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${PER_PAGE}`);
        res.status(200).send(loadEjs({
            "title": query + "LibRuStore",
            "query": query,
            "page": page,
            "apps": result.apps,
            "isFirst": page == 0,
            "isLast": result.total == page * PER_PAGE + result.apps.length,
            "max": Math.ceil(result.total / PER_PAGE)
        }, "search.ejs"));
    } catch(e) {
        res.status(500).send(loadEjs({
            "title": "Error",
            "error": e
        }, "error.ejs"));
    }
});

app.get("/app/:pkg", async (req, res) => {
    const pkg = req.params.pkg;
    try {
        const info = await rm.get("/info?pkg=" + encodeURIComponent(pkg));
        res.status(200).send(loadEjs({
            "title": info.meta.fullName + " | LibRuStore",
            "info": info
        }, "app.ejs"));
    } catch(e) {
        res.status(500).send(loadEjs({
            "title": "Error",
            "error": e
        }, "error.ejs"));
    }
});

app.get("/apk", async (req, res) => {
    const id = req.query.id;
    const abis = [
        req.query["armeabi-v7a"] && "armeabi-v7a",
        req.query["arm64-v8a"] && "arm64-v8a",
        req.query["x86"] && "x86",
        req.query["x86_64"] && "x86_64",
    ].filter(Boolean).join(",");
    try {
        const links = await rm.get("/apk?id=" + encodeURIComponent(id) + "&abis=" + encodeURIComponent(abis));
        res.redirect(links[0]);
    } catch(e) {
        res.status(500).send(loadEjs({
            "title": "Error",
            "error": e
        }, "error.ejs"));
    }
});

app.listen(12701);