` ============================== Helper functions (2) =======================================`;

// 1
export const makeGlobal = obj => {
  for (const apiName in obj) {
    window[apiName] = obj[apiName];
  }
};

// 2
export function createRenderPipeline(
  device,
  {
    vertex: { code, entryPoint, ...otherVertexProps },
    fragment: { code: fcode, entryPoint: fentryPoint, ...otherFragmentProps },
    ...otherProps
  }
) {
  return device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code
      }),
      entryPoint,
      ...otherVertexProps
    },
    fragment: {
      module: device.createShaderModule({
        code: fcode
      }),
      entryPoint: fentryPoint,
      ...otherFragmentProps
    },
    // All other props
    ...otherProps
  });
}

` ============================== Shaders (2) =======================================`;

export const createShaders = () => {
  const struct = {
    name: "Output",
    code: `
      struct Output {
          [[builtin(position)]] pos: vec4<f32>;
          [[location(0)]] color: vec4<f32>;
      };
  `
  };
  const vertex = `
     {{struct}}

     [[stage(vertex)]]
     fn main([[location(0)]] pos: vec4<f32>, [[location(1)]] color: vec4<f32>) -> {{structName}} {
         var output: {{structName}};
         output.pos = pos;
         output.color = color;
         return output;
     }`
    .replace("{{struct}}", struct.code)
    .replaceAll("{{structName}}", struct.name);

  const fragment = `
     {{struct}}

     [[stage(fragment)]]
     fn main(input: {{structName}}) -> [[location(0)]] vec4<f32> {
         return input.color;
     }

     // [[stage(fragment)]]
     // fn main([[location(0)]] color: vec4<f32>) -> [[location(0)]] vec4<f32> {
     //     return color;
     // }
     `
    .replace("{{struct}}", struct.code)
    .replaceAll("{{structName}}", struct.name);

  return {
    vertex,
    fragment
  };
};

export const createSquare = async ({ canvas }) => {
  if (!navigator.gpu) {
    throw new Error(`Your current browser does not support WebGPU!`);
  }

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
  const vertexBuffer = device.createBuffer({
    size: 4 * (2 + 3) * 3,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  });

  //  prettier-ignore
  const vertexData = new Float32Array([
    // pos 1    // color 1 (red)
    0.0, 0.5,   1, 0, 0,
    // pos 2    // color 2 (orange)
    -0.5, -0.5, 1, 1, 0,
    // pos 3    // color 3 (blue)
    0.5, -0.5,  0, 0, 1
  ]);
  new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
  vertexBuffer.unmap();

  // 4. Render Pipeline
  const { vertex, fragment } = createShaders();

  const pipeline = createRenderPipeline(device, {
    vertex: {
      code: vertex,
      entryPoint: "main",
      buffers: [
        {
          arrayStride: (2 + 3) * 4,
          attributes: [
            {
              shaderLocation: 0,
              format: "float32x2",
              offset: 0
            },
            {
              shaderLocation: 1,
              offset: 2 * 4,
              format: "float32x3"
            }
          ]
        }
      ]
    },
    fragment: {
      code: fragment,
      entryPoint: "main",
      targets: [
        {
          format: swapChainFormat
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
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
        // loadValue: { r: 0.5, g: 0.5, b: 0.8, a: 1.0 }, //background color
        loadValue: [0.5, 0.5, 0.8, 1.0], //background color - can either be map or vector
        storeOp: "store"
      }
    ]
  });
  renderPass.setPipeline(pipeline);
  renderPass.setVertexBuffer(0, vertexBuffer);

  renderPass.draw(3);
  renderPass.endPass();

  // 7. enqueue the task
  device.queue.submit([commandEncoder.finish()]);
};
