//
const CheckWebGPU = () => {
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

const Shaders = () => {
  const vertex = `
        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] VertexIndex: u32) -> [[builtin(position)]] vec4<f32> {
            var pos = array<vec2<f32>, 6>(
                vec2<f32>(-0.5,  0.7),
                vec2<f32>( 0.3,  0.6),
                vec2<f32>( 0.5,  0.3),
                vec2<f32>( 0.4, -0.5),
                vec2<f32>(-0.4, -0.4),
                vec2<f32>(-0.3,  0.2)
            );
            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        }`;

  const fragment = `
        [[stage(fragment)]]
        fn main() ->  [[location(0)]] vec4<f32> {
            return vec4<f32>(1.0, 1.0, 0.0, 1.0);
        }`;
  return { vertex, fragment };
};

const CreatePrimitive = async ({ primitiveType = "point-list", canvas }) => {
  CheckWebGPU();
  let indexFormat = undefined;
  if (primitiveType === "line-strip") {
    indexFormat = "uint32";
  }

  // const canvas = document.getElementById("canvas-webgpu");
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");

  const format = "bgra8unorm";
  context.configure({
    device: device,
    format: format
  });

  const shader = Shaders();
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
          format: format
        }
      ]
    },
    primitive: {
      topology: primitiveType,
      stripIndexFormat: indexFormat
    }
  });

  const commandEncoder = device.createCommandEncoder();
  const textureView = context.getCurrentTexture().createView();

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: textureView,
        loadValue: [0.5, 0.5, 0.8, 1], //background color
        storeOp: "store"
      }
    ]
  });
  renderPass.setPipeline(pipeline);
  renderPass.draw(6);
  renderPass.endPass();

  device.queue.submit([commandEncoder.finish()]);
};

export default {
  CreatePrimitive,
  Shaders
};
