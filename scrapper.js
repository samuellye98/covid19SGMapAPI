// https://levelup.gitconnected.com/web-scraping-with-node-js-c93dcf76fe2b
// https://medium.com/@stefanhyltoft/scraping-html-tables-with-nodejs-request-and-cheerio-e3c6334f661b
const siteUrl = 'https://co.vid19.sg/singapore/cases/search';
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');

const fetchData = async () => {
  const result = await axios.get(siteUrl);
  return cheerio.load(result.data);
};

const getResults = async () => {
  const casesTable = new Object();
  const geoTableByCases = {
    type: 'FeatureCollection',
    features: [],
  };

  // Scraping data
  const $ = await fetchData();
  $('#casesTable > tbody > tr').each((index, element) => {
    const tds = $(element).find('td');
    const caseId = $(tds[0]).text();
    const caseNo = parseInt(caseId, 10);
    const patient = $(tds[1]).text();
    const age = parseInt($(tds[2]).text().trim());
    const gender = $(tds[3]).text();
    const nationality = $(tds[4]).text();
    const status = $(tds[5]).text();
    const infectionSource = $(tds[6]).text();
    const countryOfOrigin = $(tds[7]).text();
    const symptomaticToConfirmation = $(tds[8]).text();
    const daysToRecover = $(tds[9]).text();
    const symptomaticAt = $(tds[10]).text();
    const confirmedAt = $(tds[11]).text();
    const recoveredAt = $(tds[12]).text();
    const displayedSymptoms = $(tds[13]).text();
    const cluster = '-';
    const tableRow = {
      caseNo,
      patient,
      age,
      gender,
      nationality,
      status,
      infectionSource,
      countryOfOrigin,
      symptomaticToConfirmation,
      daysToRecover,
      symptomaticAt,
      confirmedAt,
      recoveredAt,
      displayedSymptoms,
      cluster,
    };
    casesTable[caseId] = tableRow;
  });

  // Creating cluster geoJSON data
  const geoTableByClusters = {
    type: 'FeatureCollection',
    features: [],
  };
  // Appending cluster to relevant cases
  const clusterData = require('./clusters.json');
  for (var i = 0; i < clusterData.length; i++) {
    var clusterObj = clusterData[i];
    var clusterObjCases = clusterObj['cases'];
    var clusterObjCoordinates = clusterObj['coordinates'];
    var clusterLocation = clusterObj['location'];

    var geoCase = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: clusterObjCoordinates },
      properties: {
        location: clusterLocation,
        cases: [],
        numCases: 0,
      },
    };

    for (var k = 0; k < clusterObjCases.length; k++) {
      var tempCase = clusterObjCases[k].toString();
      casesTable[tempCase].cluster = clusterObj.location;
      geoCase['properties'].cases.push(casesTable[tempCase]);
    }

    geoCase['properties'].numCases = geoCase['properties'].cases.length;
    geoTableByClusters['features'].push(geoCase);
  }

  // Write JSON file
  var casesJSON = JSON.stringify(geoTableByClusters);
  fs.writeFileSync('./scrapedCases.json', casesJSON, 'utf-8');

  console.log('Scrape Complete');

  // Data to send to client-side
  return geoTableByClusters;
};

module.exports = getResults;
