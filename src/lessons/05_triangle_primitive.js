export const ShadersOld1 = () => {
  const vertex = `
    let pos : array<vec2<f32>, 9> = array<vec2<f32>, 9>(
        vec2<f32>(-0.63,  0.80),
        vec2<f32>(-0.65,  0.20),
        vec2<f32>(-0.20,  0.60),
        vec2<f32>(-0.37, -0.07),
        vec2<f32>( 0.05,  0.18),
        vec2<f32>(-0.13, -0.40),
        vec2<f32>( 0.30, -0.13),
        vec2<f32>( 0.13, -0.64),
        vec2<f32>( 0.70, -0.30)
    );
    let color : array<vec3<f32>, 9> = array<vec3<f32>, 9>(
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
    );
    struct Output {
        [[builtin(position)]] Position : vec4<f32>;
        [[location(0)]] vColor : vec4<f32>;
    };
    [[stage(vertex)]]
    fn main([[builtin(vertex_index)]] VertexIndex: u32) -> Output {
        var output: Output;
        output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        output.vColor = vec4<f32>(color[VertexIndex], 1.0);
        return output;
    }`;

  const fragment = `
        [[stage(fragment)]]
        fn main([[location(0)]] vColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
            return vColor;
        }
    `;
  return { vertex, fragment };
};

export const ShadersOld = () => {
  const vertex = `
    const pos : array<vec2<f32>, 9> = array<vec2<f32>, 9>(
        vec2<f32>(-0.63,  0.80),
        vec2<f32>(-0.65,  0.20),
        vec2<f32>(-0.20,  0.60),
        vec2<f32>(-0.37, -0.07),
        vec2<f32>( 0.05,  0.18),
        vec2<f32>(-0.13, -0.40),
        vec2<f32>( 0.30, -0.13),
        vec2<f32>( 0.13, -0.64),
        vec2<f32>( 0.70, -0.30)
    );
    const color : array<vec3<f32>, 9> = array<vec3<f32>, 9>(
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
    );
    [[builtin(position)]] var<out> Position : vec4<f32>;
    [[builtin(vertex_idx)]] var<in> VertexIndex : i32;
    [[location(0)]] var<out> vColor : vec4<f32>;
    [[stage(vertex)]]
    fn main() -> void {
      Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
      vColor = vec4<f32>(color[VertexIndex], 1.0);
      return;
    }`;

  const fragment = `
        [[location(0)]] var<in> vColor : vec4<f32>;
        [[location(0)]] var<out> outColor : vec4<f32>;
        [[stage(fragment)]]
        fn main() -> void {
            outColor = vColor;
            return;
        }
    `;
  return { vertex, fragment };
};

export const Shaders = (vert = null, frag = null) => {
  const vertex =
    vert ||
    `
    struct Output {
        [[builtin(position)]] Position : vec4<f32>;
        [[location(0)]] vColor : vec4<f32>;
    };
    [[stage(vertex)]]
    fn main([[builtin(vertex_index)]] VertexIndex: u32) -> Output {
        var pos : array<vec2<f32>, 9> = array<vec2<f32>, 9>(
            vec2<f32>(-0.63,  0.80),
            vec2<f32>(-0.65,  0.20),
            vec2<f32>(-0.20,  0.60),
            vec2<f32>(-0.37, -0.07),
            vec2<f32>( 0.05,  0.18),
            vec2<f32>(-0.13, -0.40),
            vec2<f32>( 0.30, -0.13),
            vec2<f32>( 0.13, -0.64),
            vec2<f32>( 0.70, -0.30)
        );

        var color : array<vec3<f32>, 9> = array<vec3<f32>, 9>(
            vec3<f32>(1.0, 0.0, 0.0),
            vec3<f32>(0.0, 1.0, 0.0),
            vec3<f32>(0.0, 0.0, 1.0),
            vec3<f32>(1.0, 0.0, 0.0),
            vec3<f32>(0.0, 1.0, 0.0),
            vec3<f32>(0.0, 0.0, 1.0),
            vec3<f32>(1.0, 0.0, 0.0),
            vec3<f32>(0.0, 1.0, 0.0),
            vec3<f32>(0.0, 0.0, 1.0),
        );
        var output: Output;
        output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        output.vColor = vec4<f32>(color[VertexIndex], 1.0);
        return output;
    }`;

  const fragment =
    frag ||
    `
        [[stage(fragment)]]
        fn main([[location(0)]] vColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
            return vColor;
        }
    `;
  return { vertex, fragment };
};

export const CreatePrimitive = async ({
  primitiveType = "triangle-list",
  canvas,
  vert,
  frag,
  background,
  draw
}) => {
  let indexFormat = undefined;
  `"Date: 6:12PM Monday, 16th August 2021 - added primitiveType === 'line-strip'`;
  if (primitiveType === "triangle-strip" || primitiveType === "line-strip") {
    indexFormat = "uint32";
  }

  `Step 1: Create adapter, device and context`;
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu", { anitialias: false });

  `Step 2: Configure swap chain by calling configure method`;
  // const format = "bgra8unorm";
  const format = context.getPreferredFormat(adapter);
  context.configure({
    device: device,
    format: format
  });

  `Step 3: Create a pipeline using createRenderPipeline function
    - This will get used in the renderPass.setPipeline method
    - Rendering pipeline combines our shaders, vertex attributes,
      and output configuration, which we can use to render our triangle.
  `;
  const { vertex, fragment } = Shaders(vert, frag);
  const pipeline = device.createRenderPipeline({
    // Vertex module
    vertex: {
      module: device.createShaderModule({
        code: vertex
      }),
      entryPoint: "main"
    },
    // Fragment module
    fragment: {
      module: device.createShaderModule({
        code: fragment
      }),
      entryPoint: "main",
      targets: [
        {
          format: format
        }
      ]
    },
    // Primitive module: For speciying
    primitive: {
      topology: primitiveType, // One of the following: point-list, line-list, line-strip, triangle-list triangle-strip
      stripIndexFormat: indexFormat
    }
  });

  // Step 4: Create command encoder
  const commandEncoder = device.createCommandEncoder();

  // Step 5: Rendering - Begin render pass
  // Accepts: 1 prop: colorAttachments
  // - array of object with 3 properties
  // - view: context.getCurrentTexture().createView();
  // - loadvalue: map or array
  // - storeOp: string

  // We are saying render into this view, loadValue is background color and store op  says to store all the information
  // TASK: change the stopreOp to

  `
  Rendering in WebGPU takes place during a Render Pass, which is described through a GPURenderPassDescriptor.
  The render pass descriptor specifies the images to bind to the output slots written from the fragment shader,
  and optionally a depth buffer and the occlusion query set.

  The color and depth attachments specified must match the color and depth states specified for the render pipelines
  used in the render pass. Our fragment shader writes to a single output slot, the object color,
  which we’ll write to the current swap chain image. As the image will change each frame to the
  current swap chain image, we don’t set it just yet.
  `;

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(), // A GPUTextureView describing the texture subresource that will be output to for this color attachment.
        loadValue: background || [0.5, 0.3, 0.6, 1.0], //background color -
        storeOp: "store"
      }
    ]
  });

  renderPass.setPipeline(pipeline);

  // drawing
  renderPass.draw.apply(renderPass, draw || [9, 1, 0, 0]);
  renderPass.endPass();

  // Step 6: Submit the work to the queue
  device.queue.submit([commandEncoder.finish()]);
};
