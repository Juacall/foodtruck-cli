const neatCsv = require("neat-csv");
const fs = require("fs");
const geolib = require("geolib");
const readline = require("readline");

var nearby = [];

function distanceSorter(a, b) {
  var x = a.distance;
  var y = b.distance;
  return x < y ? -1 : x > y ? 1 : 0;
}

function FoodTruck(data, distance) {
  this.data = data;
  this.distance = distance;
}

async function showTopFive() {
  for (var i = 0; i < 5; i++) {
    var item = nearby[i];
    console.log(`${i + 1}. ${item.data.Applicant} ${item.distance} mi.`);
  }

  const ans = await askToChooseTruckQuestion(
    "\nEnter a number to choose a truck for more info!!\nEnter q to quit! \n"
  );
}

async function showTruckDetail(rl, ans) {
  var truck = nearby[ans];
  console.log(
    `${truck.data.Applicant}\n${truck.data.Address}\n${truck.data.FoodItems}\n\n`
  );

  const gobackquestion = (query) => {
    return new Promise((resolve, reject) => {
      rl.question(query, (answer) => {
        switch (answer) {
          case "b":
          case "B":
            rl.close;
            showTopFive();
            break;

          case "q":
          case "Q":
            console.log("Thank you for using foodtruck-cli!!!");
            rl.close();
            resolve(false);
            break;

          default:
            rl.close();
            console.log("Invalid choice try again!!!");
            gobackquestion("");
            break;
        }
      });
    });
  };

  await gobackquestion("Enter b to go back!! or Enter q to quit\n");
}

function askToChooseTruckQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      switch (ans) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
          showTruckDetail(rl, ans);
          resolve(true);
          break;
        case "q":
        case "Q":
          console.log("Thank you for using foodtruck-cli!!!");
          rl.close();
          resolve(false);
          break;

        default:
          rl.close();
          console.log("Invalid choice try again!!!");
          asktoChooseQuestion("");
          break;
      }
    })
  );
}

module.exports = () => {
  console.log("Welcome to the food truck finder for all your food truck needs");
  //   const args = minimist(process.argv.slice(2));

  var args = process.argv.slice(2);

  const lat = parseFloat(args[0]);
  const long = parseFloat(args[1]);

  fs.readFile("./foodtruck.csv", async (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const result = await neatCsv(data);

    result.forEach((record) => {
      var recordObject = {};
      record.Latitude = parseFloat(record.Latitude);
      record.Longitude = parseFloat(record.Longitude);

      var distance = geolib.getDistance(
        { latitude: lat, longitude: long },
        { latitude: record.Latitude, longitude: record.Longitude },
        1
      );
      distance *= 0.000621371;
      if (distance < 2.0 && record.Status == "APPROVED") {
        var truck = new FoodTruck(record, distance.toFixed(2));
        nearby.push(truck);
        // console.log(truck);
      }
    });

    nearby.sort(distanceSorter);

    showTopFive();
  });
};
