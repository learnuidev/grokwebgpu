// NOTE: DOES NOT WORK
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

// Shaders
const GlslShaders = () => {
  const vertex = `
        #version 450
        const vec2 pos[3] = vec2[3](
            vec2( 0.0f,  0.5f),
            vec2(-0.5f, -0.5f),
            vec2( 0.5f, -0.5f)
        );
        const vec3 color[3] = vec3[3](
            vec3(1.0f, 0.0f, 0.0f),
            vec3(0.0f, 1.0f, 0.0f),
            vec3(0.0f, 0.0f, 1.0f)
        );
        layout(location=0) out vec4 vColor;
        void main() {
            vColor = vec4(color[gl_VertexIndex], 1.0f);
            gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
        }
    `;

  const fragment = `
        #version 450
        layout(location=0) in vec4 vColor;
        layout(location=0) out vec4 fragColor;
        void main() {
            fragColor = vColor;
        }
    `;
  return { vertex, fragment };
};

// Shaders
const Shaders = () => {
  const vertex = `
        const pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
            vec2<f32>(0.0, 0.5),
            vec2<f32>(-0.5, -0.5),
            vec2<f32>(0.5, -0.5)
        );
        const color : array<vec3<f32>, 3> = array<vec3<f32>, 3>(
            vec3<f32>(1.0, 0.0, 0.0),
            vec3<f32>(0.0, 1.0, 0.0),
            vec3<f32>(0.0, 0.0, 1.0)
        );
        [[builtin(position)]] var<out> Position : vec4<f32>;
        [[builtin(vertex_idx)]] var<in> VertexIndex : i32;
        [[location(0)]] var<out> vColor : vec4<f32>;
        [[stage(vertex)]]
        fn main() -> void {
            Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
            vColor = vec4<f32>(color[VertexIndex], 1.0);
            return;
        }
    `;

  const fragment = `
        [[location(0)]] var<in> vColor : vec4<f32>;
        [[location(0)]] var<out> fragColor : vec4<f32>;
        [[stage(fragment)]]
        fn main() -> void {
            fragColor = vColor;
            return;
        }
    `;
  return { vertex, fragment };
};

//
const CreateTriangle = async ({ canvas, glslangModule }) => {
  const checkgpu = CheckWebGPU();
  if (checkgpu.includes("Your current browser does not support WebGPU!")) {
    console.log(checkgpu);
    throw "Your current browser does not support WebGPU!";
  }

  const glslang = await glslangModule();

  // const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("gpupresent");
  const swapChainFormat = "bgra8unorm";
  const swapChain = context.configureSwapChain({
    device: device,
    format: swapChainFormat
  });

  const shader = GlslShaders();
  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: glslang.compileGLSL(shader.vertex, "vertex")
      }),
      entryPoint: "main"
    },
    fragment: {
      module: device.createShaderModule({
        code: glslang.compileGLSL(shader.fragment, "fragment")
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
        loadValue: [0.5, 0.5, 0.8, 1], //background color
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
  CreateTriangle
};
