function addComponent(value) {
  const element = document.createElement("div");

  element.innerHTML = "isAwesomeFeatureEnabled: " + value;

  document.body.appendChild(element);
}

const myWorker = new Worker("worker.js");

myWorker.onmessage = (e) => {
  console.log("Feature flag value received from worker");
  addComponent(e.data);
}

myWorker.postMessage("isAwesomeFeatureEnabled");
console.log("Feature flag key posted to worker");
