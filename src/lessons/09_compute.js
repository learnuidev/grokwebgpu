export function yieldToBrowser() {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, 0);
  });
}

export async function setStatus(message) {
  document.getElementById("status").textContent = message;
  await yieldToBrowser();
}

async function computeOnGPU(matrixA, matrixB, matrixDimension) {
  // Slide 1: Initialize WebGPU
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  // Slide 2: Allocate memory for the matrix data.
  const matrixSize = matrixDimension * matrixDimension * 4; // sizeof(float) == 4

  const gpuMatrixA = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.STORAGE,
    mappedAtCreation: true,
  });

  new Float32Array(gpuMatrixA.getMappedRange()).set(matrixA);
  gpuMatrixA.unmap();

  const gpuMatrixB = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.STORAGE,
    mappedAtCreation: true,
  });

  new Float32Array(gpuMatrixB.getMappedRange()).set(matrixB);
  gpuMatrixB.unmap();

  const gpuMatrixC = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
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

    var result : f32 = 0.0;
    for (var i = 0u; i < ${matrixDimension}u; i = i + 1u) {
      let aCell = i + resultCell.x * ${matrixDimension}u;
      let bCell = resultCell.y + i * ${matrixDimension}u;
      result = result + matrixA.data[aCell] * matrixB.data[bCell];
    }

    matrixC.data[resultIndex] = result;
  }`;

  // Slide 4b: Compile the GPU program.
  const computePipeline = device.createComputePipeline({
    compute: {
      module: device.createShaderModule({
        code: wgslSource,
      }),
      entryPoint: "main",
    },
  });

  // Slide 3: Create the data “group”.
  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: gpuMatrixA } },
      { binding: 1, resource: { buffer: gpuMatrixB } },
      { binding: 2, resource: { buffer: gpuMatrixC } },
    ],
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
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  commandEncoder.copyBufferToBuffer(
    gpuMatrixC,
    0,
    gpuReadBuffer,
    0,
    matrixSize
  );

  // Slide 7: Submit work to the GPU.
  await setStatus("Computing on the GPU");
  const timeBefore = window.performance.now();

  const gpuCommands = commandEncoder.finish();
  device.queue.submit([gpuCommands]);

  await gpuReadBuffer.mapAsync(GPUMapMode.READ);
  const cpuMatrixC = gpuReadBuffer.getMappedRange();

  const elapsedTime = window.performance.now() - timeBefore;
  await setStatus("GPU finished");

  const resultArray = new ArrayBuffer(cpuMatrixC.byteLength);
  const result = new Float32Array(resultArray);
  result.set(new Float32Array(cpuMatrixC));

  return [result, elapsedTime];
}

// test data
// matrixDimension = 2048
// matrixElements = matrixDimension * matrixDimension

function randomFloats(elementCount) {
  const matrix = [];
  for (let i = 0; i < elementCount; i++) {
    matrix.push(Math.random() * 10);
  }
  return matrix;
}

async function computeOnCPU(matrixA, matrixB, matrixDimension) {
  const resultArray = new ArrayBuffer(matrixA.length * 4);
  const result = new Float32Array(resultArray);

  const timeBefore = window.performance.now();
  await setStatus("Computing on the GPU");

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

    if (resultX % 10 === 0) {
      await setStatus("CPU computed row " + resultX);
    }
  }

  const elapsedTime = window.performance.now() - timeBefore;
  await setStatus("CPU finished");

  return [result, elapsedTime];
}

function randomFloats(elementCount) {
  const matrix = [];
  for (let i = 0; i < elementCount; i++) {
    matrix.push(Math.random() * 10);
  }
  return matrix;
}

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
  const average = (arr) => arr.reduce((acc, v) => acc + v) / arr.length;
  console.log((average(gpuTimes) / 1000).toFixed(3));

  const [cpuResult, cpuTime] = await computeOnCPU(
    matrixA,
    matrixB,
    matrixDimension
  );
  document.getElementById("cputime").textContent =
    (cpuTime / 1000).toFixed(3) + "s";

  return;

  await setStatus("Computing correctness");

  let correct = true;
  for (let i = 0; i < matrixElements; i++) {
    if (Math.abs(1.0 - gpuResult[i] / cpuResult[i]) > 0.00001) {
      correct = false;
    }
  }

  if (correct) {
    document.getElementById("correctness").textContent = "Computations match!";
  } else {
    document.getElementById("correctness").textContent =
      "Computations don't match (float addition issue?)";
  }
  await setStatus("Done");
}
