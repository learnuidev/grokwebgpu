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
    primitive
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
      ...primitive
    }
  });
}

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

export const createSquare = async ({ canvas }) => {
  checkWebGPU();

  // 1. Initialize
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  const swapChainFormat = "bgra8unorm";

  // 2. Swap Chain
  context.configure({
    device: device,
    format: swapChainFormat
  });

  // 3. Buffers
  const vertexBuffer = device.createBuffer({
    size: 24,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const vertexArray = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);

  new Float32Array(vertexBuffer.getMappedRange()).set(vertexArray);
  vertexBuffer.unmap();

  const colorBuffer = device.createBuffer({
    size: 48,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const colorArray = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]);
  new Float32Array(colorBuffer.getMappedRange()).set(colorArray);
  colorBuffer.unmap();

  // 4. Render Pipeline
  const shader = createShaders();

  const pipeline = createRenderPipeline(device, {
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
      code: shader.fragment,
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
  const textureView = context.getCurrentTexture().createView();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: textureView,
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
