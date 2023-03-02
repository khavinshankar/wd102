const http = require("http");
const fs = require("fs");

const args = (() => {
  return process.argv.slice(2).reduce((acc, arg) => {
    if (arg.slice(0, 2) === "--") {
      const [flag, value] = arg.slice(2).split("=");
      acc[flag] = value || true;
    } else {
      const flag = arg.slice(1);
      acc[flag] = true;
    }

    return acc;
  }, {});
})();

const PORT = args.port || 3000;

const get_html = (file_name) => {
  return fs.readFileSync(file_name + ".html");
};

http
  .createServer((request, response) => {
    let url = request.url;
    response.writeHeader(200, { "Content-Type": "text/html" });
    switch (url) {
      case "/registration":
        response.write(get_html("registration"));
        response.end();
        break;
      case "/project":
        response.write(get_html("project"));
        response.end();
        break;
      default:
        response.write(get_html("home"));
        response.end();
        break;
    }
  })
  .listen(PORT);
