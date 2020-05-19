const conf = require("./runboy.rc");
const path = require("path");
const util = require("util");
const fs = require("fs-extra");
const moment = require("moment");

// const exec = require("child_process").exec;
var shell = require("shelljs");

async function shouldWeTry() {
  let db = await fs.readJSON(__dirname + "/db.json");
  console.log("lets do this");

  const day = moment().day();
  if (day > db.day) {
    console.log("reloading all data");
    db.done = {};
  }

  for (script of conf.scripts) {
    if (db.done[script.name]) {
      console.log("already done ", script.name);
      continue;
    } else {
      const res = await execute(script);
      console.log("res: ", res);
      if (res) {
        db.done[script.name] = true;
      }
    }
  }

  db.day = day;

  await fs.writeJSON(__dirname + "/db.json", db);
}

async function execute(script) {
  return new Promise(async (resolve) => {
    // console.error('stderr:', );
    const folder =
      "out/" + script.name + "/" + moment().format("MM-DD-YYYY--h:mm:ss");
    fs.mkdirp(folder);
    shell.cd(script.pwd);
    shell.exec(script.command, { silent: true }, (err, stdout, stderr) => {
      if (err) {
        //some err occurred
        console.error(err);
        fs.writeFile(path.join(__dirname, folder, "errors.log"), err + stderr);
        fs.move(
          path.join(__dirname, folder),
          path.join(__dirname, folder + "🟥")
        );
        resolve(false);
      } else {
        // the *entire* stdout and stderr (buffered)
        //  console.log(`stderr: ${stderr}`);
        fs.writeFile(path.join(__dirname, folder, "log.log"), stdout);
        fs.writeFile(path.join(__dirname, folder, "errors.log"), stderr);
        fs.move(
          path.join(__dirname, folder),
          path.join(__dirname, folder + "✅")
        );
        resolve(true);
      }
    });
  });
}
// lsExample();

setInterval(shouldWeTry, 1000 * 60 * 10);
shouldWeTry();
