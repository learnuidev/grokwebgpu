// Lesson Structs

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

export const Shaders = (vert = null, frag = null) => {
  const vertex =
    vert ||
    `
        struct VertexOutput {
            [[builtin(position)]] pos : vec4<f32>;
            [[location(0)]] color : vec4<f32>;
        };

        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] vIndex: u32) -> VertexOutput {
            var pos = array<vec2<f32>, 3>(
                vec2<f32>(0.0, 0.5),
                vec2<f32>(-0.5, -0.5),
                vec2<f32>(0.5, -0.5)
            );

            var color = array<vec3<f32>, 3>(
                vec3<f32>(1.0, 0.0, 0.0),
                vec3<f32>(0.0, 1.0, 0.0),
                vec3<f32>(0.0, 0.0, 1.0)
            );
            var output: VertexOutput;
            output.pos = vec4<f32>(pos[vIndex], 0.0, 1.0);
            output.color = vec4<f32>(color[vIndex], 1.0);
            return output;
        }
    `;

  const fragment =
    frag ||
    `
    [[stage(fragment)]]
    fn main([[location(0)]] color: vec4<f32>) -> [[location(0)]] vec4<f32> {
        return color;
    }
    `;

  return { vertex, fragment };
};
export const ShadersWrong = (vert = null, frag = null) => {
  const vertex =
    vert ||
    `
        struct VertexOutput {
            [[builtin(position)]] pos: vec4<f32>;
            [[location(0)]] vIndex: u32;
        };

        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] vIndex: u32) -> VertexOutput {
            var pos = array<vec2<f32>, 3>(
                vec2<f32>(0.0, 0.5),
                vec2<f32>(-0.5, -0.5),
                vec2<f32>(0.5, -0.5)
            );

            var output: VertexOutput;
            output.pos = vec4<f32>(pos[vIndex], 0.0, 1.0);
            output.vIndex = vIndex;
            return output;
        }
    `;

  const fragment =
    frag ||
    `
    struct VertexOutput {
        [[builtin(position)]] pos : vec4<f32>;
        [[location(0)]] vIndex: u32;
    };

    [[stage(fragment)]]
    fn main(vOutput: VertexOutput) -> [[location(0)]] vec4<f32> {
        var color = array<vec3<f32>, 3>(
            vec3<f32>(1.0, 1.0, 0.0),
            vec3<f32>(0.2, 1.0, 0.0),
            vec3<f32>(0.0, 0.0, 1.0)
        );

        return vec4<f32>(color[vOutput.vIndex], 1.0);
    }
    `;
  return { vertex, fragment };
};

export const CreateTriangle = async ({ canvas, vert, frag, graphics }) => {
  CheckWebGPU();

  `Step 1: GPU Adapter`;
  const adapter = await navigator.gpu.requestAdapter();

  `Step 2: GPU Device`;
  const device = await adapter.requestDevice();

  `Step 3: WebGPU Context`;
  const context = canvas.getContext("webgpu");

  `Step 4: Configure Swap Chain`;
  const swapChainFormat = "bgra8unorm";
  context.configure({
    device: device,
    format: swapChainFormat
  });

  console.log("GRAPHICS", graphics);

  `Step 5: Render Pipeline`;

  const shader = Shaders(vert, frag);
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
      topology: "triangle-list"
    }
  });

  `Step 5: Command Encoder`;
  const commandEncoder = device.createCommandEncoder();

  `Step 6: Render Pass`;
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
  renderPass.draw(3, 1, 0, 0);
  renderPass.endPass();

  `Step 7: Submit`;
  device.queue.submit([commandEncoder.finish()]);
};
