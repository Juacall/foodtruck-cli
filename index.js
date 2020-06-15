const neatCsv = require("neat-csv");
const fs = require("fs");
const geolib = require("geolib");
const readline = require("readline");

var nearby = [];

/**
 * @class FoodTruck
 *
 */
function FoodTruck(data, distance) {
  this.data = data;
  this.distance = distance;
}

/**
 * Compares two food truck items by distance
 *
 * @param {FoodTruck} first The first food truck object
 * @param {FoodTruck} second The second food truck object
 * @returns {boolean}
 */
function distanceSorter(a, b) {
  var x = a.distance;
  var y = b.distance;
  return x < y ? -1 : x > y ? 1 : 0;
}

/**
 *
 * Shows top five in list of nearby trucks;
 *
 */
async function showTopFive() {
  for (var i = 0; i < 5; i++) {
    var item = nearby[i];
    console.log(`${i + 1}. ${item.data.Applicant} ${item.distance} mi.`);
  }
  //Wait for user input
  await askToChooseTruckQuestion(
    "\nEnter a number to choose a truck for more info!!\nEnter q to quit! \n"
  );
}

/**
 *
 * Shows details of selected food truck
 * @param {ReadLine Object} first Readline object to continue user inputs
 * @param {number} second  food truck selection
 *
 */
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
            rl.close; //close rl so it can be recreated
            showTopFive();
            break;

          case "q":
          case "Q":
            console.log("Thank you for using foodtruck-cli!!!");
            rl.close();
            resolve(false);
            break;

          default:
            rl.close(); //close rl so it can be recreated
            console.log("Invalid choice try again!!!");
            gobackquestion("");
            break;
        }
      });
    });
  };

  await gobackquestion("Enter b to go back!! or Enter q to quit\n");
}

/**
 *
 * Asks question to choose option.
 * @param {String} first question to be asked.
 *
 */
function askToChooseTruckQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      switch (ans - 1) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4": //All choices have the same outcome
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
          askToChooseTruckQuestion("");
          break;
      }
    })
  );
}

module.exports = () => {
  console.log("Welcome to the food truck finder for all your food truck needs");

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
      distance *= 0.000621371; // Meter conversion to miles.

      // Only show food trucks that has approved permit
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
