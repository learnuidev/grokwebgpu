// ` ===========================================================================================`;
// ` ============================== Helper functions (6) =======================================`;
function flatten(coll) {
  if (coll) return coll.flat();
}

export const makeGlobal = obj => {
  for (const apiName in obj) {
    window[apiName] = obj[apiName];
  }
};
// makeGlobal.doc = `Makes properties of the input object global for enabling REPLIsh development experience on the browser
//    usage: const jon = {name: "jon snow"}
//    makeGlobal(jon)
//    console.log(window.jon) => "jon snow"
// `.split("\n");
//
// makeGlobal.src = `
// export const makeGlobal = obj => {
//   for (const apiName in obj) {
//     window[apiName] = obj[apiName];
//   }
// };
// `.split("\n");

export function createRenderPipeline(
  device,
  {
    vertex: { code, entryPoint, buffers, ...otherVertexProps },
    fragment: {
      code: fcode,
      entryPoint: fentryPoint,
      targets,
      ...otherFragmentProps
    },
    primitive: { topology, ...otherPrimitiveProps }
  }
) {
  return device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code
      }),
      entryPoint,
      buffers: buffers
    },
    fragment: {
      module: device.createShaderModule({
        code: fcode,
        ...otherVertexProps
      }),
      entryPoint: fentryPoint,
      targets: targets,
      ...otherFragmentProps
    },
    primitive: {
      topology,
      ...otherPrimitiveProps
    }
  });
}

export const createGPUBuffer = (
  device, // WebGPUDevice
  input, // Array
  usageFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
) => {
  // 1. Convert array into float32 data
  const data = new Float32Array(input);

  // 2. Create buffer (this object gets returned)
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: usageFlag,
    mappedAtCreation: true
  });

  // 3: Get Access to the Content
  new Float32Array(buffer.getMappedRange()).set(data);

  // 4. Unmap so that data can be used by the GPU
  buffer.unmap();
  return buffer;
};
// createGPUBuffer.doc = `
//   info ===
//   Makes properties of the input object global
//   enabling REPLIsh development experience
//   on the browser
//   ===
//   usage ===
//   const jon = {name: "jon snow"}
//   makeGlobal(jon)
//   => console.log(window.jon) => "jon snow"
// `.split("\n");
//
// createGPUBuffer.src = `
// export const createGPUBuffer = (
//   device,
//   input,
//   usageFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
// ) => {
//   Step 1: Convert input array into float32 array
//   const data = new Float32Array(input);
//
//   Step 2: Create buffer
//   const buffer = device.createBuffer({
//     size: data.byteLength, // needs to be a Float32Array instance
//     usage: usageFlag,
//     mappedAtCreation: true
//   });
//
//   Step 3: Get Access to the Content
//   new Float32Array(buffer.getMappedRange()).set(data);
//
//   Step 4: Unmap so that GPU can make use of the data
//   buffer.unmap();
//   return buffer;
// };
// `.split("\n");

// createGPUBuffer.srcDetailed = `
// export const createGPUBuffer = (
//   device,
//   input,
//   usageFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
// ) => {
// // ===
// // Step 1: Convert input array into float32 array
// // ===
//
//   const data = new Float32Array(input);
//
// // ====
// // Step 2: Create buffer
// // ====
// 2.1 GPU buffers are created via GPUDevice.createBuffer function that
//     returns a new buffer in the mapped or unmapped state.
//
// 2.2 data consists of 3 vertices, each with a float2 vector. We
//     use Float32Array to store the vertex position: each 32-bit
//     floating-point number needs 4 bytes; each vertex needs 2
//     32-bit floating point numbers to represent the 2D coordinates
//     of x and y (here we draw the triangle on the
//     x-y plane without the z coordinate), so each vertex
//     needs 2 * 4 bytes. Thus, 3 vertices for our triangle
//     needs 3 * 2 * 4 = 24 bytes.
//
// 2.3 When the GPU buffer is mapped (by setting mappedAtCreation to true),
//     meaning it is owned by the CPU, and it is accessible in read/write from
//     JavaScript. However, it has to be unmapped in order to make it accessible by GPU.
//     The concept of mapped/unmapped is needed to prevent race conditions where GPU and CPU access
//     memory at the same time.
// ===
//
//   const buffer = device.createBuffer({
//     size: data.byteLength, // (4 * 32)
//     usage: usageFlag,
//     mappedAtCreation: true
//   });
//
//   Step 2: Get Access to the Content
//   - Once the GPU buffer is mapped, the application can
//      synchronously ask for access to ranges of its content with
//      getMappedRange.
//    - Note that a mapped GPU buffer cannot be directly used by
//      the GPU and must be unmapped using unmap function before
//      work using it can be submitted to the Queue timeline.
//
//   ===
//
//   new Float32Array(buffer.getMappedRange()).set(data);
//
//   Step 3: Unmap
//   ===
//
//   buffer.unmap();
//   return buffer;
// };
// `.split("\n");

export const initGPU = async ({ canvas }) => {
  checkWebGPU();

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  const swapChainFormat = context.getPreferredFormat(adapter);

  // Configure swap chain
  context.configure({
    device: device,
    format: swapChainFormat
  });
  return { device, context, swapChainFormat };
};

// initGPU.doc = `
// Accepts a map with the following props
//   - canvas (mandatory)
// Returns a map of with the following props
//   - device - GPUDevice: await adapter.requestDevice()
//   - swapChainFormat - "bgra8unorm"
//   - context - WebGPU Context: canvas.getContext("webgpu")
// `.split("\n");
//
// initGPU.src = `
// export const initGPU = async ({ canvas }) => {
//   // 1. Check if the browser supports WebGPU
//   checkWebGPU();
//
//   // 2. Define adapter, device, context and swapChainFormat
//   const adapter = await navigator.gpu.requestAdapter();
//   const device = await adapter.requestDevice();
//   const context = canvas.getContext("webgpu");
//   const swapChainFormat = "bgra8unorm";
//
//   // Configure swap chain
//   context.configure({
//     device: device,
//     format: swapChainFormat
//   });
//   return { device, swapChainFormat, context };
// };
// `.split("\n");

//
export const checkWebGPU = () => {
  if (!navigator.gpu) {
    throw new Error(`Your current browser does not support WebGPU! Make sure you are on a system
                     with WebGPU enabled. Currently, SPIR-WebGPU is only supported in
                     <a href="https://www.google.com/chrome/canary/">Chrome canary</a>
                     with the flag "enable-unsafe-webgpu" enabled. See the
                     <a href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status">
                     Implementation Status</a> page for more details.
                    `);
  }
};

// ` ==================================================================================`;
// ` ============================== Shaders (2) =======================================`;

export const createShaders = (vert = null, frag = null) => {
  const vertex =
    vert ||
    `
        struct Output {
            [[builtin(position)]] Position : vec4<f32>;
            [[location(0)]] vColor : vec4<f32>;
        };
        [[stage(vertex)]]
        fn main([[location(0)]] pos: vec4<f32>, [[location(1)]] color: vec4<f32>) -> Output {
            var output: Output;
            output.Position = pos;
            output.vColor = color;
            return output;
        }`;

  const fragment =
    frag ||
    `
        [[stage(fragment)]]
        fn main([[location(0)]] vColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
            return vColor;
        }`;

  return {
    vertex,
    fragment
  };
};

export const createSquare = async ({
  canvas,
  vert,
  frag,
  vertData,
  color,
  background,
  draw
}) => {
  const gpu = await initGPU({ canvas });

  const vertexData =
    flatten(vertData) ||
    flatten([
      [-0.5, -0.5], // vertex a
      [0.5, -0.5], // vertex b
      [-0.5, 0.5], // vertex d
      [-0.5, 0.5], // vertex d
      [0.5, -0.5], // vertex b
      [0.5, 0.5] // vertex c
    ]);

  const colorData =
    flatten(color) ||
    flatten([
      [1, 0, 0], // vertex a: red
      [0, 1, 0], // vertex b: green
      [1, 1, 0], // vertex d: yellow
      [1, 1, 0], // vertex d: yellow
      [0, 1, 0], // vertex b: green
      [0, 0, 1] // vertex c: blue
    ]);

  const vertexBuffer = createGPUBuffer(gpu.device, vertexData);
  const colorBuffer = createGPUBuffer(gpu.device, colorData);

  const shader = createShaders(vert, frag);
  //
  const pipelineOld = createRenderPipeline(gpu.device, {
    vertex: {
      code: shader.vertex,
      entryPoint: "main",
      buffers: [
        {
          arrayStride: 8,
          attributes: [
            {
              shaderLocation: 0,
              format: "float32x2",
              offset: 0
            }
          ]
        },
        {
          arrayStride: 12,
          attributes: [
            {
              shaderLocation: 1,
              format: "float32x3",
              offset: 0
            }
          ]
        }
      ]
    },
    fragment: {
      code: shader.fragment,
      entryPoint: "main",
      targets: [
        {
          format: gpu.swapChainFormat
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    }
  });

  const pipeline = gpu.device.createRenderPipeline({
    vertex: {
      module: gpu.device.createShaderModule({
        code: shader.vertex
      }),
      entryPoint: "main",
      buffers: [
        {
          arrayStride: 8,
          attributes: [
            {
              shaderLocation: 0,
              format: "float32x2",
              offset: 0
            }
          ]
        },
        {
          arrayStride: 12,
          attributes: [
            {
              shaderLocation: 1,
              format: "float32x3",
              offset: 0
            }
          ]
        }
      ]
    },
    fragment: {
      module: gpu.device.createShaderModule({
        code: shader.fragment
      }),
      entryPoint: "main",
      targets: [{ format: gpu.swapChainFormat }]
    },
    primitive: {
      topology: "triangle-list"
    }
  });

  // Rendering
  const commandEncoder = gpu.device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: gpu.context.getCurrentTexture().createView(),
        loadValue: background || { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }, //background color
        storeOp: "store"
      }
    ]
  });

  // 1 pipeline
  renderPass.setPipeline(pipeline);

  // 2. buffers
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setVertexBuffer(1, colorBuffer);

  // 3. draw
  let drawArg = draw ? (Array.isArray(draw) ? draw : [draw]) : [6];
  renderPass.draw.apply(renderPass, drawArg);

  // 4. end pass and submit
  renderPass.endPass();
  gpu.device.queue.submit([commandEncoder.finish()]);
};
