// simple encapsulation of dynamic Worker`;

// Example 1
const dynamicWorkerOld = () => {
  window.URL = window.URL || window.webkitURL;
  response = `onmessage = (props) => {
  const { data: { data } } = props
  console.log('Message received from main script');
  const { method } = data;
   
    const mappedData = data.map(d => d + 1)
    postMessage({
      data: {
        'res': mappedData,
      }
    });
  console.dir(props);
}`;
  blob = new Blob([response], { type: "application/javascript" });

  worker = new Worker(URL.createObjectURL(blob));

  // event processing
  worker.onmessage = (evt) => {
    // list of properties in the event object
    const {
      bubbles,
      cancelBubble,
      cancelable,
      composed,
      currentTarget,
      data,
      defaultPrevented,
      eventPhase,
      isTrusted,
      lastEventId,
      origin,
      path,
      ports,
      returnValue,
      source,
      srcElement,
      target,
      timeStamp,
      type,
    } = evt;
    console.log(evt.data);
    alert(JSON.stringify(evt.data));
  };
  worker.postMessage({
    method: "format",
    data: [1, 2, 3],
  });
};

// Example 2
let dynamicWorker = ({ response, handler }) => {
  window.URL = window.URL || window.webkitURL;
  blob = new Blob([response], { type: "application/javascript" });
  worker = new Worker(URL.createObjectURL(blob));

  // event processing
  worker.onmessage = (evt) => {
    handler(evt);
  };

  URL.revokeObjectURL(blob);

  return {
    send: (msg) => {
      return worker.postMessage(msg);
    },
    postMessage: (msg) => {
      return worker.postMessage(msg);
    },
    stop: () => {
      worker.terminate();
    },
  };
};

// usage
let response = `
onmessage = (props) => {
  const { data: { data, method } } = props
  console.log('Message received from main script');
  const mappedData = data.map((d, i) => i + 1)
  postMessage({
    data: {
      'res': mappedData,
    }
  });
}`;

let computeOnCPU = `
onmessage = (props) => {
  const {data: { data: { matrixA, matrixB, matrixDimension } }} = props
  const result = []

  for (let resultX = 0; resultX < matrixDimension; resultX++) {
    for (let resultY = 0; resultY < matrixDimension; resultY++) {
      let sum = 0.0;

      for (let i = 0; i < matrixDimension; i++) {
        const aCell = i + resultX * matrixDimension;
        const bCell = resultY + i * matrixDimension;
        sum += matrixA[aCell] * matrixB[bCell];
      }

      const resultCell = resultY + resultX * matrixDimension;
      result[resultCell] = sum;
    }
  }

  postMessage({
    data: result
  })
}`;

let handler = (evt) => {
  console.log("==== RESPONSE =====");
  console.dir(evt);
};
let exWorker = dynamicWorker({
  // response,
  response: computeOnCPU,
  handler,
});

function randomFloats(elementCount) {
  const matrix = [];
  for (let i = 0; i < elementCount; i++) {
    // matrix.push(Math.random() * 10);
    matrix.push(i);
  }
  return matrix;
}

function createData(dimension) {
  const size = dimension * dimension;
  return {
    matrixA: randomFloats(size),
    matrixB: randomFloats(size),
    matrixDimension: dimension,
  };
}

exWorker.send({ data: createData(10) });

// exWorker.postMessage({
//   method: "format",
//   data: [1, 2, 3],
// });

// console.time();
// exWorker.send({ data: new Array(10000000).fill(1) });
// console.timeEnd();

// ==========

// Example 3
const BASE_DATASETS = "";
class DynamicWorker {
  constructor(worker) {
    /**
     * Dependent global variable declaration
     * If BASE_DATASETS is not in string form and can be called JSON.stringify  And so on
     * Guarantee normal declaration of variables
     */
    const CONSTS = `const base = ${BASE_DATASETS};`;

    /**
     * Data processing function
     */
    const formatFn = `const formatFn = ${worker.toString()};`;

    /**
     * Internal onmessage processing
     */
    const onMessageHandlerFn = `self.onmessage = ()=>{}`;

    /**
     * Return results
     * @param {*} param0
     */
    const handleResult = () => {};

    const blob = new Blob(
      [
        `(()=>{
            ${CONSTS}
            ${formatFn}
            ${onMessageHandlerFn}
          })()`,
      ],
      { type: "text/javascript" }
    );
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.addEventListener("message", handleResult);

    URL.revokeObjectURL(blob);
  }

  /**
   * Dynamic call
   */
  send(data) {}

  close() {}
}
