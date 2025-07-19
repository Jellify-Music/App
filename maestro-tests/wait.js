// wait.js
const ms = 60000; // 1 minute in milliseconds
const start = Date.now();
while (Date.now() - start < ms) {
  // busy-wait
}
