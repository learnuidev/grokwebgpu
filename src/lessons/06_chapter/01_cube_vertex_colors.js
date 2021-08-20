const updateTransformationMatrix = (
  modelMat,
  translation,
  rotation,
  scaling,
  { libs }
) => {
  const { mat4 } = libs;
  const rotateXMat = mat4.create();
  const rotateYMat = mat4.create();
  const rotateZMat = mat4.create();
  const translateMat = mat4.create();
  const scaleMat = mat4.create();

  rotation = rotation || [0, 0, 0];
  translation = translation || [0, 0, 0];
  scaling = scaling || [2, 2, 1];

  //perform indivisual transformations
  mat4.fromTranslation(translateMat, translation);
  mat4.fromXRotation(rotateXMat, rotation[0]);
  mat4.fromYRotation(rotateYMat, rotation[1]);
  mat4.fromZRotation(rotateZMat, rotation[2]);
  mat4.fromScaling(scaleMat, scaling);

  //combine all transformation matrices together to form a final transform matrix: modelMat
  mat4.multiply(modelMat, rotateXMat, scaleMat);
  mat4.multiply(modelMat, rotateYMat, modelMat);
  mat4.multiply(modelMat, rotateZMat, modelMat);
  mat4.multiply(modelMat, translateMat, modelMat);
};

const createViewProjection = ({ isPerspective, aspectRatio }, props) => {
  // Returns a projection matrix
  const perspectiveCam = ({ fovy, aspectRatio, near, far }, { libs }) => {
    const projectionMatrix = libs.mat4.create();
    libs.mat4.perspective(projectionMatrix, fovy, aspectRatio, near, far);
    return projectionMatrix;
  };

  // Returns a projection matrix
  const orthoCam = ({ fovy, aspectRatio, near, far }, { libs }) => {
    const projectionMatrix = libs.mat4.create();
    libs.mat4.ortho(projectionMatrix, -4, 4, -3, 3, -1, 6);
    return projectionMatrix;
  };

  const {
    libs: { mat4 }
  } = props;

  const eyePosition = [2, 2, 4];
  const center = [0, 0, 0];
  const upDirection = [0, 1, 0];
  const viewMatrix = mat4.create();
  const viewProjectionMatrix = mat4.create();

  const projectionMatrix = isPerspective
    ? perspectiveCam(
        {
          fovy: (2 * Math.PI) / 5,
          aspectRatio,
          near: 0.1,
          far: 100.0
        },
        props
      )
    : orthoCam();
  mat4.lookAt(viewMatrix, eyePosition, center, upDirection);
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

  const cameraOption = {
    eye: eyePosition,
    center,
    zoomMax: 100,
    zoomSpeed: 2
  };

  return {
    viewMatrix,
    projectionMatrix,
    viewProjectionMatrix,
    cameraOption
  };
};

const gpuInit = async ({ canvas }) => {
  // Create adapter, device and WebGPU context
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  const swapChainFormat = "bgra8unorm";

  // Configure swap chain
  context.configure({
    device: device,
    format: swapChainFormat
  });

  `Comment: Fun fact ===
   - If you disable the line above. it throws this error:

   Error Message ===
   Uncaught (in promise) DOMException: Failed to execute
     'getCurrentTexture' on 'GPUCanvasContext': context is not configured

   Strack Trace ====
   at $jscomp.generator.Engine_.eval [as program_] (http://localhost:3000/js/cljs-runtime/module$lessons$06_chapter$01_cube_vertex_colors.js:117:62)
   at $jscomp.generator.Engine_.nextStep_ (http://localhost:3000/js/main.js:979:43)
   at $jscomp.generator.Engine_.next_ (http://localhost:3000/js/main.js:906:15)
   at $jscomp.generator.Generator_.next (http://localhost:3000/js/main.js:1011:19)
   at passValueToGenerator (http://localhost:3000/js/main.js:1049:22)
    `;

  return {
    device,
    context,
    swapChainFormat
  };
};

`==================================================================`;
`======================= createCube ==============================`;

export const createCube = async props => {
  `Step 1: Init`;
  // a. Custom npm libs
  const { libs, canvas } = props;
  const { mat4, vec3 } = libs;

  // b. constants
  const isAnimation = true;
  const isPerspective = true;

  `Step 1: CREATE GPU Device AND WebGPU Context`;
  // c. Create adapter, device and WebGPU context
  const { device, context, swapChainFormat } = await gpuInit({
    canvas
  });

  `==================================================================`;
  `Step 2: CREATE Vertices AND Vertex Buffer`;

  const cubeVertexSize = 4 * 8; // Byte size of one cube vertex.
  const cubeColorOffset = 4 * 3; // Byte offset of cube vertex color attribute.
  const vertexData = [
    //position (4),  color (3),     uv (2),
    //front
    [1, 1, 1, 1, 1, 1, 1, 1],
    [-1, 1, 1, 0, 1, 1, 0, 1],
    [-1, -1, 1, 0, 0, 1, 0, 0],
    [-1, -1, 1, 0, 0, 1, 0, 0],
    [1, -1, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    //right
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, -1, 1, 1, 0, 1, 0, 1],
    [1, -1, -1, 1, 0, 0, 0, 0],
    [1, 1, -1, 1, 1, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, -1, -1, 1, 0, 0, 0, 0],
    //back
    [1, -1, -1, 1, 0, 0, 1, 1],
    [-1, -1, -1, 0, 0, 0, 0, 1],
    [-1, 1, -1, 0, 1, 0, 0, 0],
    [1, 1, -1, 1, 1, 0, 1, 0],
    [1, -1, -1, 1, 0, 0, 1, 1],
    [-1, 1, -1, 0, 1, 0, 0, 0],
    //left
    [-1, -1, 1, 0, 0, 1, 1, 1],
    [-1, 1, 1, 0, 1, 1, 0, 1],
    [-1, 1, -1, 0, 1, 0, 0, 0],
    [-1, -1, -1, 0, 0, 0, 1, 0],
    [-1, -1, 1, 0, 0, 1, 1, 1],
    [-1, 1, -1, 0, 1, 0, 0, 0],
    //top
    [-1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, -1, 1, 1, 0, 0, 0],
    [-1, 1, -1, 0, 1, 0, 1, 0],
    [-1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, -1, 1, 1, 0, 0, 0],
    //bottom
    [1, -1, 1, 1, 0, 1, 1, 1],
    [-1, -1, 1, 0, 0, 1, 0, 1],
    [-1, -1, -1, 0, 0, 0, 0, 0],
    [1, -1, -1, 1, 0, 0, 1, 0],
    [1, -1, 1, 1, 0, 1, 1, 1],
    [-1, -1, -1, 0, 0, 0, 0, 0]
  ];

  const data = new Float32Array(vertexData.flat());

  window.vertexData = vertexData;
  window.data = data;
  const vertexBuffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  new Float32Array(vertexBuffer.getMappedRange()).set(data);
  vertexBuffer.unmap();

  `==================================================================`;

  // glslangModule = await import(/* webpackIgnore: true */ "https://unpkg.com/@webgpu/glslang@0.0.15/dist/web-devel/glslang.js");

  `==================================================================`;

  `Step 3: CREATE Render Pipeline`;
  const shaders = {
    vertex: `
          [[block]] struct Uniforms {
              mvpMatrix : mat4x4<f32>;
          };
          [[binding(0), group(0)]] var<uniform> uniforms : Uniforms;
          struct Output {
              [[builtin(position)]] Position : vec4<f32>;
              [[location(0)]] vColor : vec4<f32>;
          };
          [[stage(vertex)]]
          fn main([[location(0)]] pos: vec4<f32>, [[location(1)]] color: vec4<f32>) -> Output {
              var output: Output;
              output.Position = uniforms.mvpMatrix * pos;
              output.vColor = color;
              return output;
          }`,

    fragment: `
          [[stage(fragment)]]
          fn main([[location(0)]] vColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
              return vColor;
          }`
  };

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: shaders.vertex
      }),
      entryPoint: "main",
      buffers: [
        {
          arrayStride: cubeVertexSize, // 32
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: 0,
              format: "float32x3"
            },
            {
              // color
              shaderLocation: 1,
              offset: cubeColorOffset, // 12
              format: "float32x3"
            }
          ]
        }
      ]
    },
    fragment: {
      module: device.createShaderModule({
        code: shaders.fragment
      }),
      entryPoint: "main",
      targets: [
        {
          format: swapChainFormat
        }
      ]
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back"
    },
    depthStencil: {
      format: "depth24plus-stencil8",
      depthWriteEnabled: true,
      depthCompare: "less"
    }
  });

  `Step 4: CREATE Camera`;
  `=========================== CAMERA ==========================`;
  `Step 4.1: CREATE Uniform data`;
  const modelMatrix = mat4.create();
  const mvpMatrix = mat4.create();
  let vpMatrix = mat4.create();
  const vp = createViewProjection(
    {
      isPerspective,
      aspectRatio: canvas.width / canvas.height
    },
    props
  );
  vpMatrix = vp.viewProjectionMatrix;

  let camera = libs.camera(canvas, vp.cameraOption);

  window.camera = camera;
  `-------------------------------------------------------`;
  `Step 4.2: CREATE uniform buffer and bind group`;

  //
  const sceneUniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  // line 354: renderPass.setBindGroup(0, sceneUniformBindGroup);
  const sceneUniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: sceneUniformBuffer,
          offset: 0,
          size: 64
        }
      }
    ]
  });

  `Step 5: Draw`;
  const draw = () => {
    // 5.1. render pass
    const depthTexture = device.createTexture({
      size: [canvas.width, canvas.height, 1],
      format: "depth24plus-stencil8",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    // l352: const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
    const renderPassDescription = {
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadValue: [0.5, 0.5, 0.8, 1],
          StoreOp: "store"
        }
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthLoadValue: 1,
        depthStoreOp: "store",
        stencilLoadValue: 0,
        stencilStoreOp: "store"
      }
    };

    updateTransformationMatrix(
      modelMatrix,
      // translation
      [0, -5, -10],
      // rotation
      vec3.fromValues(0, -1, 0),
      // scaling
      [2, 2, 1],
      props
    );

    mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);
    device.queue.writeBuffer(sceneUniformBuffer, 0, mvpMatrix);

    // 7. command encoder
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
    renderPass.setPipeline(pipeline);

    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setBindGroup(0, sceneUniformBindGroup);
    renderPass.draw(36, 1, 0, 0);
    renderPass.endPass();

    // 8. submit
    device.queue.submit([commandEncoder.finish()]);
  };

  draw();
};
