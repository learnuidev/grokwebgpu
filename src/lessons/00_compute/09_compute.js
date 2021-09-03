export function randomFloats(elementCount) {
  const matrix = [];
  for (let i = 0; i < elementCount; i++) {
    // matrix.push(Math.random() * 10);
    matrix.push(i);
  }
  return matrix;
}

export async function computeOnGPU(matrixA, matrixB, matrixDimension) {
  // Slide 1: Initialize WebGPU
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  // Slide 2: Allocate memory for the matrix data.
  const matrixSize = matrixDimension * matrixDimension * 4; // sizeof(float) == 4

  const gpuMatrixA = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.STORAGE,
    mappedAtCreation: true
  });

  new Float32Array(gpuMatrixA.getMappedRange()).set(matrixA);
  gpuMatrixA.unmap();

  const gpuMatrixB = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.STORAGE,
    mappedAtCreation: true
  });

  new Float32Array(gpuMatrixB.getMappedRange()).set(matrixB);
  gpuMatrixB.unmap();

  const gpuMatrixC = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });

  // Slide 4a: GPU program source.
  // Not on the slides. Local size in X and Y. Without this the GPU will only run
  // one instance of the compute shader on a block of (for example) 32 ALUs,
  // wasting 31 of them.
  // Use localSize of 8 to avoid wasting dimensions.
  const localSize = 8;

  const wgslSource = `
  [[block]] struct Matrix {
      data: array<f32>;
  };

  [[group(0), binding(0)]] var<storage, read> matrixA : Matrix;
  [[group(0), binding(1)]] var<storage, read> matrixB : Matrix;
  [[group(0), binding(2)]] var<storage, write> matrixC : Matrix;

  [[stage(compute), workgroup_size(${localSize}, ${localSize})]]
  fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    if (global_id.x >= ${matrixDimension}u || global_id.y >= ${matrixDimension}u) {
      return;
    }

    let resultCell = global_id.xy;
    let resultIndex = resultCell.y + resultCell.x * ${matrixDimension}u;

    var index : f32 = 0.0;
    var result : f32 = 0.0;
    for (var i = 0u; i < ${matrixDimension}u; i = i + 1u) {
      let aCell = i + resultCell.x * ${matrixDimension}u;
      let bCell = resultCell.y + i * ${matrixDimension}u;
      result = result + matrixA.data[aCell] * matrixB.data[bCell];
      // result = global_id.x + global_id.y;
      // result = 4.0 + 400.0 * 765.45 + 42.0;
      // result = matrixA.data[i];
      // result = (matrixA.data[i] * matrixB.data[i]);
      index = index + 0.1;
      result = index;
      // matrixC.data[resultIndex] = result;
    }

    result = matrixA.data[resultIndex] * matrixB.data[resultIndex];
    // result = resultIndex;

    // matrixC.data[resultIndex] = matrixA.data[resultIndex];
    matrixC.data[resultIndex] = result;
    // matrixC.data[resultIndex] = matrixA.data[resultIndex];
  }`;

  // Slide 4b: Compile the GPU program.
  const computePipeline = device.createComputePipeline({
    compute: {
      module: device.createShaderModule({
        code: wgslSource
      }),
      entryPoint: "main"
    }
  });

  // Slide 3: Create the data “group”.
  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: gpuMatrixA } },
      { binding: 1, resource: { buffer: gpuMatrixB } },
      { binding: 2, resource: { buffer: gpuMatrixC } }
    ]
  });

  // Slide 5: Encode the compute commands.
  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.dispatch(
    Math.ceil(matrixDimension / localSize),
    Math.ceil(matrixDimension / localSize)
  );
  passEncoder.endPass();

  // Slide 6: Encode the readback commands.
  const gpuReadBuffer = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });

  commandEncoder.copyBufferToBuffer(
    gpuMatrixC,
    0,
    gpuReadBuffer,
    0,
    matrixSize
  );

  // Slide 7: Submit work to the GPU.
  const timeBefore = window.performance.now();

  const gpuCommands = commandEncoder.finish();
  device.queue.submit([gpuCommands]);

  await gpuReadBuffer.mapAsync(GPUMapMode.READ);
  const cpuMatrixC = gpuReadBuffer.getMappedRange();

  const elapsedTime = window.performance.now() - timeBefore;

  const resultArray = new ArrayBuffer(cpuMatrixC.byteLength);
  const result = new Float32Array(resultArray);
  result.set(new Float32Array(cpuMatrixC));

  return [result, elapsedTime];
}

export async function computeOnGPU2(matrixDimension) {
  matrixElements = matrixDimension * matrixDimension;
  matrixA = randomFloats(matrixElements);
  matrixB = randomFloats(matrixElements);

  return await computeOnGPU(matrixA, matrixB, matrixDimension);
}

export async function computeOnCPU(matrixA, matrixB, matrixDimension) {
  const resultArray = new ArrayBuffer(matrixA.length * 4);
  const result = new Float32Array(resultArray);

  const timeBefore = window.performance.now();

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

  const elapsedTime = window.performance.now() - timeBefore;

  return [result, elapsedTime];
}

export async function computeOnCPU2(matrixDimension) {
  matrixElements = matrixDimension * matrixDimension;
  matrixA = randomFloats(matrixElements);
  matrixB = randomFloats(matrixElements);

  return await computeOnCPU(matrixA, matrixB, matrixDimension);
}

// test data
// matrixDimension = 2048;
// matrixElements = matrixDimension * matrixDimension;
// matrixA = randomFloats(matrixElements);
// matrixB = randomFloats(matrixElements);

async function benchmark() {
  matrixDimension = parseInt(document.getElementById("dimension").value);
  matrixElements = matrixDimension * matrixDimension;
  if (matrixDimension > 2048) {
    alert("don't push it!");
    return;
  }

  document.getElementById("correctness").textContent = "";

  const matrixA = randomFloats(matrixElements);
  const matrixB = randomFloats(matrixElements);

  let gpuTimes = [];
  for (let i = 0; i < 10; i++) {
    console.log(i);
    const [gpuResult, gpuTime] = await computeOnGPU(
      matrixA,
      matrixB,
      matrixDimension
    );
    document.getElementById("gputime").textContent =
      (gpuTime / 1000).toFixed(3) + "s";
    gpuTimes.push(gpuTime);
  }
  const average = arr => arr.reduce((acc, v) => acc + v) / arr.length;
  console.log((average(gpuTimes) / 1000).toFixed(3));

  const [cpuResult, cpuTime] = await computeOnCPU(
    matrixA,
    matrixB,
    matrixDimension
  );
  document.getElementById("cputime").textContent =
    (cpuTime / 1000).toFixed(3) + "s";

  return;
}

// Testing CPU

`
await computeOnCPU2(100)
(2) [Float32Array(10000), 7.900000095367432]
await computeOnCPU2(200)
(2) [Float32Array(40000), 53.200000047683716]
await computeOnCPU2(300)
(2) [Float32Array(90000), 138.90000009536743]
await computeOnCPU2(400)
(2) [Float32Array(160000), 151.59999990463257]
await computeOnCPU2(500)
(2) [Float32Array(250000), 307.60000002384186]
await computeOnCPU2(600)
(2) [Float32Array(360000), 521.7999999523163]
await computeOnCPU2(700)
(2) [Float32Array(490000), 1027.2000000476837]
await computeOnCPU2(800)
(2) [Float32Array(640000), 1623]
await computeOnCPU2(900)
(2) [Float32Array(810000), 3304.7999999523163]
await computeOnCPU2(1000)
(2) [Float32Array(1000000), 4278.200000047684]
await computeOnCPU2(1100)
(2) [Float32Array(1210000), 9697]
await computeOnCPU2(1200)
(2) [Float32Array(1440000), 12777.300000071526]

await computeOnCPU2(2000)
(2) [Float32Array(4000000), 79330.89999997616]

`;

// Testing GPU
`
await computeOnGPU2(100)
(2) [Float32Array(10000), 14.600000023841858]
await computeOnGPU2(200)
(2) [Float32Array(40000), 17.799999952316284]
await computeOnGPU2(300)
(2) [Float32Array(90000), 17.899999976158142]
await computeOnGPU2(400)
(2) [Float32Array(160000), 31.699999928474426]
await computeOnGPU2(500)
(2) [Float32Array(250000), 46.699999928474426]
await computeOnGPU2(600)
(2) [Float32Array(360000), 68.19999992847443]
await computeOnGPU2(700)
(2) [Float32Array(490000), 88.39999997615814]
await computeOnGPU2(800)
(2) [Float32Array(640000), 193.59999990463257]
await computeOnGPU2(900)
(2) [Float32Array(810000), 222.5]
await computeOnGPU2(1000)
(2) [Float32Array(1000000), 225.70000004768372]
await computeOnGPU2(1100)
(2) [Float32Array(1210000), 351.6999999284744]
await computeOnGPU2(2000)
(2) [Float32Array(4000000), 1677.2000000476837]

await computeOnGPU2(2100)
(2) [Float32Array(4410000), 1641.3999999761581]
await computeOnGPU2(2200)
(2) [Float32Array(4840000), 1929.8999999761581]
await computeOnGPU2(2300)
(2) [Float32Array(5290000), 2120.100000023842]
await computeOnGPU2(2400)
(2) [Float32Array(5760000), 2837.899999976158]

await computeOnGPU2(2500)
(2) [Float32Array(6250000), 2652.7999999523163]
await computeOnGPU2(2600)
(2) [Float32Array(6760000), 3045.100000023842]
await computeOnGPU2(2700)
(2) [Float32Array(7290000), 3277.2000000476837]
await computeOnGPU2(2800)
(2) [Float32Array(7840000), 4387.400000095367]
await computeOnGPU2(2900)
(2) [Float32Array(8410000), 4060.399999976158]
await computeOnGPU2(3000)
(2) [Float32Array(9000000), 4633.399999976158]
await computeOnGPU2(3100)
(2) [Float32Array(9610000), 4961.100000023842]
await computeOnGPU2(3200)
(2) [Float32Array(10240000), 5469.700000047684]
await computeOnGPU2(3300)
(2) [Float32Array(10890000), 5351.200000047684]
await computeOnGPU2(3400)
(2) [Float32Array(11560000), 5462.899999976158]
await computeOnGPU2(3500)
(2) [Float32Array(12250000), 5479.299999952316]
await computeOnGPU2(3600)
(2) [Float32Array(12960000), 5547.399999976158]
await computeOnGPU2(3700)
(2) [Float32Array(13690000), 5521]
await computeOnGPU2(3800)
(2) [Float32Array(14440000), 5438.5]
await computeOnGPU2(3900)
(2) [Float32Array(15210000), 5705.900000095367]
await computeOnGPU2(4000)
(2) [Float32Array(16000000), 5615.799999952316]
await computeOnGPU2(4100)
(2) [Float32Array(16810000), 5439.800000071526]
await computeOnGPU2(4200)
(2) [Float32Array(17640000), 6703.900000095367]
await computeOnGPU2(4300)
(2) [Float32Array(18490000), 5605.200000047684]
await computeOnGPU2(4400)
(2) [Float32Array(19360000), 5540.5]
await computeOnGPU2(4500)
(2) [Float32Array(20250000), 5932.699999928474]
await computeOnGPU2(4600)
(2) [Float32Array(21160000), 5560.400000095367]
await computeOnGPU2(4700)
Uncaught DOMException: Device is lost

// Test 2

await computeOnGPU2(4700)
(2) [Float32Array(22090000), 5602.199999928474]
await computeOnGPU2(4600)
(2) [Float32Array(21160000), 5510.699999928474]
await computeOnGPU2(4700)
(2) [Float32Array(22090000), 5602.199999928474]
await computeOnGPU2(4800)
(2) [Float32Array(23040000), 5714.900000095367]
await computeOnGPU2(4900)
(2) [Float32Array(24010000), 5802]
await computeOnGPU2(5000)
(2) [Float32Array(25000000), 5763.899999976158]
await computeOnGPU2(5100)
Uncaught DOMException: Device is lost

// Test 3
await computeOnGPU2(5100)
(2) [Float32Array(26010000), 6474.5]
await computeOnGPU2(5200)
(2) [Float32Array(27040000), 5731.600000023842]
await computeOnGPU2(5300)
(2) [Float32Array(28090000), 5596.399999976158]
await computeOnGPU2(5400)
(2) [Float32Array(29160000), 5980]
await computeOnGPU2(5500)
Uncaught DOMException: Device is lost


`;
