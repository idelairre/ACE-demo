var cache = {};

function importAll (r) {
  r.keys().forEach(key => cache[key] = r(key));
}

importAll(require.context('../assets/video', true, /\.mp4$/));

const videos = [];

for (let key in cache) {
  videos.push(cache[key]);
}

const videoTemplate = require('./video.ejs');

const html = videoTemplate({ videos });

module.exports = html;
