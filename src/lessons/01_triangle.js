`=== A Brief Orientation to WGSL ===

- Shaders in WebGPU are written in a language called WebGPU Shading Language, abbreviated WGSL1.

- Modern shading languages have more similarities among them than differences. After all,
  their purpose is to provide a high-level syntax for the I/O and arithmetic operations
  available on the typical GPU.

- Syntactically, WGSL borrows much from Rust. Functions definitions begin with fn; return types
  appear after the parameter list, preceded by an
  arrow (->); generics use angle brackets (e.g., vec4<f32>). Scalar numeric types have terse names like f32 and u32.

- WGSL also has some similarities to Metal Shading Language (MSL).
  Attributes (e.g., [[location(0)]]) use C++-style double square brackets.
  Varyings are returned from the vertex shader as a struct, and the interpolated
  fragment values are taken as a struct-valued parameter to the fragment
  shader (which may or not be of the same as the output type of the vertex shader, but must be “compatible”).

As an introduction to the language, we will look at the vertex and fragment
shaders that will produce our first triangle.


Source: https://metalbyexample.com/webgpu-part-one/
`;

`=== Meaning of double bracket...
Question: Meaning of double bracket “[[foo()]] type name;” syntax in c++?

Answer: That is the attribute specifier syntax. It was introduced as a unified syntax to access
        what were formerly compiler-specific extensions (now some are standardized).

Source: https://stackoverflow.com/questions/40451840/meaning-of-double-bracket-foo-type-name-syntax-in-c
 `;
const Shaders = color => {
  `                                    == A Basic Vertex Shader ==
  - As in Metal Shading Language, we can define a struct that contains the outputs of our
    vertex shader. We are obligated to provide a vec4<f32> (a four-element floating-point vector) containing
    the clip-space vertex position, attributed with [[builtin(position)]].
  - In this sample, we also return a vertex color, which will be used by the fragment shader:


    struct VertexOut {
      [[builtin(position)]] position : vec4<f32>;
      [[location(0)]] color : vec4<f32>;
    };

  - The vertex shader itself is a function attributed with [[stage(vertex)]], similar to MSL’s vertex keyword.
    Vertex function parameters indicate where their values should be fetched from with location attributes.
    We will see shortly how to create a mapping from these location indices to the vertex buffers we bind when drawing.

  - In this sample, the vertex function simply constructs an instance of the output struct,
    populates it with the fetched vertex data, and returns it:


    [[stage(vertex)]]
    fn vertex_main([[location(0)]] position: vec4<f32>,
                   [[location(1)]] color: vec4<f32>) -> VertexOut
    {
      var output : VertexOut;
      output.position = position;
      output.color = color;
      return output;
    }
  `;

  const vertex = `
        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] VertexIndex: u32) -> [[builtin(position)]] vec4<f32> {
            var pos = array<vec2<f32>, 3>(
                vec2<f32>(0.0, 0.5),
                vec2<f32>(-0.5, -0.5),
                vec2<f32>(0.5, -0.5)
            );
            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        }
    `;

  `                                     == A Basic Fragment Shader ==
  - The fragment shader’s job is to return a color for its pixel based on its inputs.
    In this example, the output color is just the interpolated color from the rasterizer:


    [[stage(fragment)]]
    fn main(fragData: VertexOut) -> [[location(0)]] vec4<f32> {
      return fragData.color;
    }

  - The location attribute on the return type indicates the index of the color attachment
    to which the color should be written. In Metal, a single vector return value is inferred
    to correspond to the first color attachment. In WGSL, we are obligated to provide this index explicitly.

  - This completes the shader code for the sample. We’ll see in the next section how to incorporate this
    shader code into a complete render pipeline.

`;
  const fragment = `
        [[stage(fragment)]]
        fn main() -> [[location(0)]] vec4<f32> {
            return vec4<f32>${color};
        }
    `;
  return { vertex, fragment };
};

`Comment: How to create a triangle`;
const CreateTriangle = async ({ color = "(1.0,1.0,1.0,1.0)", canvas }) => {
  ` === Step 1 : Access GPU Adapter ===
    Access the GPU (adapter + device) (https://developers.google.com/web/updates/2019/08/get-started-with-gpu-compute-on-the-web)
     - Accessing the GPU is easy in WebGPU.
       Calling navigator.gpu.requestAdapter() returns a JavaScript promise that will asynchronously resolve with a GPU adapter.
       Think of this adapter as the graphics card.
       It can either be integrated (on the same chip as the CPU) or discrete (usually a PCIe card that is more performant but uses more power).
  `;
  const adapter = await navigator.gpu.requestAdapter();

  ` === Step 2 Access GPU Device ===
   - Once you have the GPU adapter, call adapter.requestDevice() to get a promise that will resolve with a GPU device you’ll
     use to do some GPU computation.
   - This device object provides a context to work with the hardware and an interface to create GPU objects
     such as buffers and textures, and execute commands on the device. - Practical WebGPU Graphics, Chapter 2.13
  `;
  const device = await adapter.requestDevice();

  ` === Step 3: Access the canvas WebGPU context ===
   - As with WebGL, we need a context for the HTML5 canvas element that will be used to
     display the rendered graphics.
   - We can get the WebGPU context like so: canvas.getContext("webgpu")
  `;
  const context = canvas.getContext("webgpu");

  `=============================================================================`;
  `=============================================================================`;

  ` === Step 4: Configure the Swap Chain ===

  - WebGPU like Vulkan does not have the concept of a "default framebuffer", hence it
    requires an infrastructure that will own the buffers we will render to before
    we visualize them on the screen. This infrastructure is known as the swap chain
    and must be created explicitly in WebGPU. The swap chain is essentially a queue
    of images that are waiting to be presented to the screen. Our application
    will acquire such an image to draw to it, and then return it to the queue.
    How exactly the queue works and the conditions for presenting an image from
    the queue depend on how the swap chain is set up, but the general purpose of
    the swap chain is to synchronize the presentation of images with the refresh
    rate of the screen.

  - Next we’ll create a swap chain and specify where the results output from our
    fragment shader should be written. To display the images on our canvas, we
    need a swap chain associated with its context.

  - The swap chain will let us rotate through the images being displayed on
    the canvas, rendering to a buffer which is not visible while another is
    shown (i.e., double-buffering). We create a swap chain by specifying the
    desired image format and texture usage. The swap chain will create one
    or more textures for us, sized to match the canvas they’ll be displayed on.

  - Since we’ll be rendering directly to the swap chain textures, we specify
    that they’ll be used as output attachments.

  - Note that the swap chain is a series of virtual framebuffers used in the graphics
    card and graphics API for frame rate stabilization. In WebGPU, the swap chain exists in the GPU memory.
    It has become a universal concept in modern graphics standard. The swap chain has already
    been used in DirectX 12 and Vulkan.

  // ===

  To display what we draw on the screen, we need to configure the context’s swap chain.
  Abstractly, the swap chain is the pool of textures that we will render to and which will be shown on-screen.
  This is similar to how we configure the device and pixel format of an MTKView or CAMetalLayer. - https://metalbyexample.com/webgpu-part-one/

  `;

  ` === Info - Swap Chain: Alternate Solution ====

    Step 1: Define call the confgureSwapChain from context and passing device and format attributes object
            and save it in a constant called swapChain
    const swapChain = context.configureSwapChain({
      device: device,
      format: swapChainFormat
    });
    Usage:

    Step 2: retrieve textureView
    const textureView = context.getCurrentTexture().createView();
  `;

  const swapChainFormat = "bgra8unorm";
  `Used in two places: context.configure and device.createRenderPipeline (pipeline)`;

  context.configure({
    device: device,
    format: swapChainFormat
  });
  `By passing the device to the configure() function, we create a linkage between the GPU and the canvas.`;

  `=============================================================================`;
  `=============================================================================`;

  `Step 5.0: Vertex and Fragment Shaders
   We need to implement a vertex shader and a fragment shader to
   create a simple triangle on the canvas.

   A vertex shader processes each incoming vertex. It takes attributes,
   such as world position, color, normal, and texture coordinates as input. The output
   is the final position in clip coordinates and the attributes such as color and
   texture coordinates, which need to be passed on to the fragment shader. These
   values will then be interpolated over the fragments to produce a smooth color gradient.

   Note that a clip coordinate is a 4D vector from the vertex shader that is subsequently
   converted into a normalized device coordinate by dividing the whole vector by its
   last component. These normalized device coordinates are homogeneous coordinates that
   map the framebuffer to a [−1, 1] by [−1, 1] coordinate system.`;

  let col;

  if (typeof color === "object") {
    const { r, g, b, a } = color;
    col = "( " + r + ", " + g + ", " + b + ", " + a + ")";
  }

  const shader = Shaders(col);

  ` === Step 5: Rendering Pipeline ===
   - Now that we have some shaders and some vertex data, we’re ready to assemble our
     render pipeline. This consists of several steps involving many different descriptor types,
     so we’ll go one step at a time.
   `;

  `Step 5.1: Creating Shader Modules by calling device.createShaderModule
   - First, we need the shaders as a string. Shaders function returns an object with two properties:
     vertex and fragment shaders

   - We use the device’s createShaderModule() function to turn the shader string into a
     shader module, from which we can get shader functions.

   - Different implementations
     will do different things behind the scenes, but a Metal implementation might
     create a MTLLibrary at this point, since there is a natural parallel between a
     WebGPU shader module and a Metal shader library.

  `;
  const vertShaderModule = device.createShaderModule({
    code: shader.vertex
  });

  const fragShaderModule = device.createShaderModule({
    code: shader.fragment
  });

  `Step 5.2: Render Pipeline Descriptors
  What we have done so far is the basic initialization steps, including GPUAdapter, GPUDevice, and
  GPUSwapChain, etc. All of these objects are common for any WebGPU applications and they do not
  need to reset or change. However, after this initialization, the rendering pipeline and the shading
  program will be different for different applications.

  The WebGPU rendering pipeline consists of two programmable states: the vertex shader and fragment
  shader, similar to WebGL. WebGPU also adds support for compute shaders, which exist outside the
  rendering pipeline.

  To render our triangle, we need to configure this pipeline, creating the shaders and specifying
  vertex attributes. In WebGPU, the GPURenderPipeline object is used to specify the different pieces
  of the pipeline. The configuration of the components of this pipeline, such as the shaders,
  vertex state, and render output state, are fixed, allowing the GPU to better
  optimize rendering for the pipeline. While the buffer or textures bound to the corresponding inputs or
  outputs can be changed.

  We create the rendering pipeline that combines the shaders, vertex attributes, and output configuration by
  calling the device.createRenderPipeline function:
  `;

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: vertShaderModule,
      entryPoint: "main"
    },
    fragment: {
      module: fragShaderModule,
      entryPoint: "main",
      targets: [
        {
          format: swapChainFormat
        }
      ]
    },
    primitiveTopology: "triangle-list"
  });
  ` Step 5.2: Render Pipeline Descriptors Cont.
   - The pipeline requires the vertex and fragment attributes, which corresponds to
     the vertex shader and fragment shader respectively.

   - Both the vertex and fragment attributes accepts a object with two properties:
      - module: which we defined in the previous step
      - entryPoint: string of "main" which refers to the main function in vertex shader

   - The fragment attribute include an additional targets attribute, which specifies the set of output
     slots and texture format. Here, our fragment shader has a single output slot for the color,
     which we will write directly to the swap chain image. Thus, we specify a single color state
     for an image with the swap chain format.

   - We use a primitive topology of 'triangle-list', since we will be drawing a list of
     triangles (really just one triangle)

   Now that we have our rendering pipeline object. Next step is to encode rendering work. In order do that
   we create a command encoder and begin a render pass
  `;

  `=== Aside: The Command Submission Model + Render Passes ===
  - Just like Metal, WebGPU requires us to record GPU commands into a command buffer to submit
    them to the GPU for execution.

  - In contrast to Metal, WebGPU does not require you to explicitly create a command buffer
    prior to encoding commands. Instead, you create a command encoder directly from the device,
    and when you’re ready to submit a batch of commands for execution, you call the finish()
    function on the encoder. This function returns a command buffer that can be submitted to
    the device’s command queue.

  - To understand exactly how to submit rendering work to the GPU, we first need to understand the anatomy
    of render passes.

  === Render Passes ===

  - Each frame is subdivided into one or more render passes. A render pass is a
    sequence of commands that consists of a load phase, one or more draw calls, and a store phase.

  - The outputs of a render pass are written to one or more attachments. In the simplest case,
    there is just one color attachment, and it stores the rendered image that will be displayed
    on the screen. Other scenarios may use several color attachments, a depth attachment, etc.

  - Each attachment has its own load operation, which determines its contents at the beginning of
    the pass, and store operation, which determines whether the results of the pass are stored or
    discarded. By providing a load value of 'load', we tell WebGPU to retain the existing contents
    of the target; by providing a value (such as a color) instead, we indicate that the target
    should be “cleared” to that value.

  - To tell WebGPU which textures to draw into, we create a render pass descriptor, which is little
    more than a collection of attachments:

    const renderPassDescriptor = {
      colorAttachments: [{
        loadValue: { r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
        storeOp: 'store',
        view: context.getCurrentTexture().createView()
      }]
    };
 `;

  `=============================================================================`;
  `=============================================================================`;

  `=== Step 6: Rendering Output ===`;

  `=== 6.1 device.createCommandEncoder ===
  - The final step is to record and submit GPU commands using a GPU command encoder.
    Note that the GPUCommandEncoder is directly derived from the MTLCommandEncoder in Metal;
    while in DirectX 12 and Vulkan, it is called GraphicsCommandList and CommandBuffer respectively.
    Since the GPU is an independent coprocessor, all GPU commands are executed asynchronously.
    This is why there is a list of GPU commands built up and sent in batches when needed.
    In WebGPU, the GPU command encoder returned by the device.createCommandEncoder method is a
    JavaScript object that builds a batch of buffered commands that will be sent to the GPU at some point.
   `;
  const commandEncoder = device.createCommandEncoder();

  `=== 6.2 commandEncoder.beginRenderPass ===
   - After setting the command encoder, we then open a render pass by calling the
     beginRenderPass method. This render pass accepts a parameter of type
     GPURenderPassDescriptor as a render pass option that has two fields: one is a
     required field called colorAttachments that is an array attached to the current
     render channel to store image information. In our example, it stores the
     background color as [0.5, 0.8, 0.5, 1.0] representing [R, G, B, alpha] in the
     localValue attribute, while in the view attribute, it stores the rendering
     result on the current image of the swap chain, i.e., swapChain.getCurrentTexture().createView().
     We also pass storeOp to "store"
   - The other field is called depthStencilAttachment that stores the depth information
     of the rendering pass and the template information. Our triangle example does
     not need depth information because it is actually drawing a 2D flat (without depth) triangle.`;
  const renderPass = commandEncoder.beginRenderPass(
    // Render pass descriptor
    {
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadValue: { r: 0.5, g: 0.5, b: 0.8, a: 1.0 }, //background color
          storeOp: "store"
        }
      ]
    }
  );

  `=== 6.3 renderPass - setPipline, draw, endPass ===`;
  `We assign the pipeline to the render pass`;
  renderPass.setPipeline(pipeline);

  `We draw our triangle by calling the renderPass.draw method`;
  renderPass.draw(3, 1, 0, 0);

  `We use the renderPass.endPass method to finish the current rendering pass, indicating
   that no more instructions are sento the GPU`;
  renderPass.endPass();

  `We then submit all instructions to the queue of the GPU device for execution. After
   running the command, our triangle will be written to the swap chain and displayed
   on the canvas, as shown in the following code snippet:`;
  device.queue.submit([commandEncoder.finish()]);
};

export default {
  Shaders,
  CreateTriangle
};
