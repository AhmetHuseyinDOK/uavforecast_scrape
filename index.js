const puppeteer = require("puppeteer");

const search = "34400";

(async () => {
  const searchSelector = `#address`;
  const tableSelector = `#main > main > div > div:nth-child(13) > table`;
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  console.log("first");
  await page.goto("https://www.uavforecast.com/", {
    timeout: 10000,
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector(searchSelector);
  await page.click(searchSelector);
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.keyboard.type(search);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  //const tableElem = await page.$();
  let res = await page.$eval(tableSelector, (element) => {
    function mapDOM(element, json) {
      var treeObject = {};

      // If string convert to document Node
      if (typeof element === "string") {
        if (window.DOMParser) {
          parser = new DOMParser();
          docNode = parser.parseFromString(element, "text/xml");
        } else {
          // Microsoft strikes again
          docNode = new ActiveXObject("Microsoft.XMLDOM");
          docNode.async = false;
          docNode.loadXML(element);
        }
        element = docNode.firstChild;
      }

      //Recursively loop through DOM elements and assign properties to object
      function treeHTML(element, object) {
        object["type"] = element.nodeName;
        var nodeList = element.childNodes;
        if (nodeList != null) {
          if (nodeList.length) {
            object["content"] = [];
            for (var i = 0; i < nodeList.length; i++) {
              if (nodeList[i].nodeType == 3) {
                object["content"].push(nodeList[i].nodeValue);
              } else {
                object["content"].push({});
                treeHTML(nodeList[i], object["content"][object["content"].length - 1]);
              }
            }
          }
        }
        if (element.attributes != null) {
          if (element.attributes.length) {
            object["attributes"] = {};
            for (var i = 0; i < element.attributes.length; i++) {
              object["attributes"][element.attributes[i].nodeName] = element.attributes[i].nodeValue;
            }
          }
        }
      }
      treeHTML(element, treeObject);

      return json ? JSON.stringify(treeObject) : treeObject;
    }
    return mapDOM(element);
  });
  let latestResult = getData(res);
  console.log(latestResult);
  require("fs").writeFileSync("result.json", JSON.stringify(latestResult));
  browser.close();
})();

function isNotComment(cnt) {
  return cnt.type !== "#comment";
}

function getStringData(cnt) {
  if (typeof cnt === "string") {
    return cnt.trim();
  }

  if (!cnt.content) return "";

  return cnt.content.map((cnt) => getStringData(cnt)).join("");
}

function getData(data) {
  let header = data.content[2].content[1].content.filter(isNotComment).map(getStringData);
  let rows = data.content[2].content.slice(3, -2).map((cnt) => cnt.content?.filter(isNotComment).map(getStringData));
  return rows.map((r) => {
    let obj = {};
    for (let index = 0; index < header.length; index++) {
      const key = header[index];
      const value = r[index];
      obj[key] = value;
    }
    return obj;
  });
}
