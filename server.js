const express = require(`express`);
const path = require(`path`);
const minimist = require(`minimist`);

var knownOptions = {
  string: `env`,
  default: { env: process.env.NODE_ENV || `production` }
};

var options = minimist(process.argv.slice(2), knownOptions);

const devBuild = options.env === `development`;
const env = devBuild ? `debug` : `release`;
const port = devBuild ? 1234 : 2345;

var htdocs = path.resolve(__dirname, `./build/${ env }/www/`);
var app = express();

app.use(express.static(htdocs));
app.listen(port, function ()
{
  console.log(`Server started on http://localhost:` + port);
});