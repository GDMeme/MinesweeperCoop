import { readFileSync } from 'fs';

function syncReadFile(filename) {
  const contents = readFileSync(filename, 'utf-8');

  const arr = contents.split(/\r?\n/);

  return arr;
}

let arr = syncReadFile('./input.txt');


let result = 1;
for (let i = 0; i < arr.length; i++) {
    result *= (1 - (parseInt(arr[i]) / 100));
}

console.log(`Chance of winning: ${result * 100}%`);