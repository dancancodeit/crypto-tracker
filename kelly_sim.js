

const b = Number(process.argv[2]);
const p = Number(process.argv[3]);
const q = 1 - p;

const f = (b * p - q) / b;


console.log(`b = ${b}
p = ${p}
q = ${q}
f* = ${f}`);
