//
const checkWebGPU = () => {
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

const createShaders = (vert = null, frag = null) => {
  const vertex =
    vert ||
    `
        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] VertexIndex: u32) -> [[builtin(position)]] vec4<f32> {
            var pos = array<vec2<f32>, 8>(
                vec2<f32>(-0.6,  0.7),
                vec2<f32>(-0.7,  0.4),
                vec2<f32>(-0.8,  0.7),
                vec2<f32>( 0.3,  0.6),
                vec2<f32>( 0.5,  0.3),
                vec2<f32>( 0.4, -0.5),
                vec2<f32>(-0.4, -0.4),
                vec2<f32>(-0.3,  0.2)
            );
            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        }`;

  const fragment =
    frag ||
    `
        [[stage(fragment)]]
        fn main() ->  [[location(0)]] vec4<f32> {
            return vec4<f32>(1.0, 1.0, 0.0, 1.0);
        }`;
  return { vertex, fragment };
};

const createPrimitive = async ({
  primitiveType = "point-list",
  canvas,
  vert,
  frag,
  draw
}) => {
  checkWebGPU();

  let indexFormat = undefined;
  if (primitiveType === "line-strip") {
    indexFormat = "uint32";
  }

  // const canvas = document.getElementById("canvas-webgpu");
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");

  // Configure Swap Chain
  // const swapChainFormat = "bgra8unorm";
  const swapChainFormat = context.getPreferredFormat(adapter);
  context.configure({
    device: device,
    format: swapChainFormat
  });

  const shader = createShaders(vert, frag);
  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: shader.vertex
      }),
      entryPoint: "main"
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
    },
    primitive: {
      topology: primitiveType,
      stripIndexFormat: indexFormat
    }
  });

  const commandEncoder = device.createCommandEncoder();

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadValue: [0.2, 0.5, 0.8, 1], //background color
        storeOp: "store"
      }
    ]
  });
  renderPass.setPipeline(pipeline);
  renderPass.draw(draw);
  renderPass.endPass();

  device.queue.submit([commandEncoder.finish()]);
};

export default {
  createPrimitive,
  createShaders
};
