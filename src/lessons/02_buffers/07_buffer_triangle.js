` ===========================================================================================`;
` ============================== Helper functions (6) =======================================`;
function flatten(coll) {
  return coll.flat();
}

export const makeGlobal = obj => {
  for (const apiName in obj) {
    window[apiName] = obj[apiName];
  }
};

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

` ==================================================================================`;
` ============================== Shaders (2) =======================================`;

export const createShaders = () => {
  const vertex = `
     struct VertexOutput {
         [[builtin(position)]] pos: vec4<f32>;
         [[location(0)]] color: vec4<f32>;
     };

     [[stage(vertex)]]
     fn main([[location(0)]] pos: vec4<f32>, [[location(1)]] color: vec4<f32>) -> VertexOutput {
         var output: VertexOutput;
         output.pos = pos;
         output.color = color;
         return output;
     }`;

  const fragment = `
     [[stage(fragment)]]
     fn main([[location(0)]] vColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
         return vColor;
     }
     `;

  return {
    vertex,
    fragment
  };
};

// Main Function
export const createSquare = async ({ canvas }) => {
  checkWebGPU();

  // 1. Initialize
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  // const swapChainFormat = "bgra8unorm";
  const swapChainFormat = context.getPreferredFormat(adapter);

  // 2. Swap Chain
  context.configure({
    device: device,
    format: swapChainFormat
  });

  // 3. Buffers
  // 3.0 Constants: Data Input
  // prettier-ignore
  const vertex0 = [
     0.0, 0.5,
     -0.5, -0.5,
     0.5, -0.5
    ];
  // prettier-ignore
  const vertex1 = [
      1,  1,
     -1, -1,
      1, -1
  ]
  // prettier-ignore
  const vertexArray = new Float32Array(vertex1);
  // Constants
  // 3.1 Vertex Buffer
  const vertexBuffer = device.createBuffer({
    size: vertexArray.byteLength, // (2 * 4) * 3 = 24
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  new Float32Array(vertexBuffer.getMappedRange()).set(vertexArray);
  vertexBuffer.unmap();

  // 3.2 Color Buffer
  // prettier-ignore
  const color = [
    1, 0, 0, 1,
    0, 1, 1, 1,
    0, 1, 1, 1
  ];

  const colorArray = new Float32Array(color);
  const colorBuffer = device.createBuffer({
    size: colorArray.byteLength, // (4 * 4) * 3 = 48
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  new Float32Array(colorBuffer.getMappedRange()).set(colorArray);
  colorBuffer.unmap();

  // 4. Render Pipeline
  const shader = createShaders();

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
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
          arrayStride: 16,
          attributes: [
            {
              shaderLocation: 1,
              format: "float32x4",
              offset: 0
            }
          ]
        }
      ]
    },
    fragment: {
      module: device.createShaderModule({
        code: shader.fragment
      }),
      entryPoint: "main",
      targets: [
        {
          format: swapChainFormat
        }
      ]
    }
  });

  // 5. Command Encoder
  const commandEncoder = device.createCommandEncoder();

  // 6. Render Pass
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadValue: { r: 0.5, g: 0.5, b: 0.8, a: 1.0 }, //background color
        storeOp: "store"
      }
    ]
  });
  renderPass.setPipeline(pipeline);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setVertexBuffer(1, colorBuffer);

  renderPass.draw(3, 1, 0, 0);
  renderPass.endPass();

  // 7. enqueue the task
  device.queue.submit([commandEncoder.finish()]);
};
