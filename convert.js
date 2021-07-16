const data = require("./data.json");

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

console.log(getData(data));
