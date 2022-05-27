var express = require("express");
var router = express.Router();

console.log("sss");
router.get("/", (req, res) => res.send("im in general"));
router.get("/test", (req, res) => res.send("hello world"));

module.exports = router;
