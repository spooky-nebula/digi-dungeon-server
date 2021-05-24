let rollDice = function (diceQuantity, diceType, modifier) {
  return new Promise((resolve, reject) => {
    if (diceQuantity > 69) {
      console.log("too many dice rolled");
      reject();
    }
  
    if (diceQuantity == 1) {
      console.log('dice singular');
      let data = {};
      let roll = Math.floor(Math.random() * diceType + 1);
      data.rolls = [roll];
      data.result = roll + modifier;
      resolve(data);
    } else {
      console.log('dice lot');
      let data = {};
      data.rolls = [];
      data.result = 0;
      for (let i = 0; i < diceQuantity; i++) {
        let roll = Math.floor(Math.random() * diceType + 1);
        data.rolls.push(roll);
        data.result += roll;
        if (i + 1 == diceQuantity) {
          data.result += modifier;
          resolve(data);
        }
      }
    }
  });
};

module.exports = {
  rollDice: rollDice,
};
