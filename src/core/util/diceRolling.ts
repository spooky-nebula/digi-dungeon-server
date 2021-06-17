export class RollData {
  rolls: number[];
  result: number;

  constructor() {
    this.rolls = [];
    this.result = 0;
  }
}

export function roll (diceQuantity: number, diceType: number, modifier: number): Promise<RollData> {
  return new Promise((resolve, reject) => {
    if (diceQuantity > 69) {
      console.log("too many dice rolled");
      reject();
    }
  
    if (diceQuantity == 1) {
      console.log('dice singular');
      let roll = Math.floor(Math.random() * diceType + 1);
      let data = new RollData();
      data.rolls = [roll];
      data.result = roll + modifier;
      resolve(data);
    } else {
      console.log('dice lot');
      let data = new RollData();
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
}
