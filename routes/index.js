const express = require('express');
const router = express.Router();
const getResults = require('../scrapper.js');
/* GET home page. */
router.get('/', async function (req, res, next) {
  const result = await getResults();
  res.send(result);
});
module.exports = router;
