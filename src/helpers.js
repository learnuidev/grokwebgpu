const Shaders = color => {
  const vertex = `
        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] VertexIndex: u32) -> [[builtin(position)]] vec4<f32> {
            var pos = array<vec2<f32>, 3>(
                vec2<f32>(0.0, 0.5),
                vec2<f32>(-0.5, -0.5),
                vec2<f32>(0.5, -0.5));
            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        }
    `;

  const fragment = `
        [[stage(fragment)]]
        fn main() -> [[location(0)]] vec4<f32> {
            return vec4<f32>${color};
        }
    `;
  return { vertex, fragment };
};

const CreateTriangle = async ({ color = "(1.0,1.0,1.0,1.0)", canvas }) => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  const swapChainFormat = "bgra8unorm";
  const swapChain = context.configureSwapChain({
    device: device,
    format: swapChainFormat
  });

  const shader = Shaders(color);
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
    primitiveTopology: "triangle-list"
  });

  const commandEncoder = device.createCommandEncoder();
  const textureView = swapChain.getCurrentTexture().createView();
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
  renderPass.draw(3, 1, 0, 0);
  renderPass.endPass();

  device.queue.submit([commandEncoder.finish()]);
};

const CreateTriangleOld = async (color = "(1.0,1.0,1.0,1.0)") => {
  const canvas = document.getElementById("app");
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  const swapChainFormat = "bgra8unorm";
  const swapChain = context.configureSwapChain({
    device: device,
    format: swapChainFormat
  });

  const shader = Shaders(color);
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
    primitiveTopology: "triangle-list"
  });

  const commandEncoder = device.createCommandEncoder();
  const textureView = swapChain.getCurrentTexture().createView();
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
  renderPass.draw(3, 1, 0, 0);
  renderPass.endPass();

  device.queue.submit([commandEncoder.finish()]);
};

export default {
  Shaders,
  CreateTriangle,
  CreateTriangleOld
};
