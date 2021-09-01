const matrix4 = (() => {
  // scaling function
  const fromScaling = v => {
    // prettier-ignore
    return new Float32Array([
         v[0], 0,    0,    0, // x = 1st item  - 0th index
         0,    v[1], 0,    0, // y = 6th item  - 5th index
         0,    0,    v[2], 0, // z = 11th item - 10th index
         0,    0,    0,    1
    ])
  };

  // Perform axis-specific matrix multiplication
  const fromXRotation = rad => {
    // prettier-ignore
    return new Float32Array([
      1,  0,             0,             0,
      0,  Math.cos(rad), Math.sin(rad), 0,
      0, -Math.sin(rad), Math.cos(rad), 0,
      0, 0,              0,             1
    ])
  };
  const fromYRotation = rad => {
    // prettier-ignore
    return new Float32Array([
      Math.cos(rad), 0, -Math.sin(rad), 0,
      0,             1,  0,             0,
      Math.sin(rad), 0,  Math.cos(rad), 0,
      0,             0,  0,             1
    ])
  };
  const fromZRotation = rad => {
    // prettier-ignore
    return new Float32Array([
       Math.cos(rad), Math.sin(rad), 0,  0,
      -Math.sin(rad), Math.cos(rad), 0,  0,
       0,             0,             1,  0,
       0,             0,             0,  1
    ])
  };
  // Matrix helpers
  // translate in x or y axis
  const translate = ([x, y, z]) => {
    // prettier-ignore
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ])
  };

  return {
    fromScaling,
    fromXRotation,
    fromYRotation,
    fromZRotation,
    translate
  };
})();

const updateTransformationMatrix = (
  modelMat,
  translation,
  rotation,
  scaling,
  { libs }
) => {
  const { mat4 } = libs;
  window.mat4 = mat4;

  rotation = rotation || [2, 0, 0];
  translation = translation || [0, 0, 0];
  scaling = scaling || [2, 2, 1];

  //perform indivisual transformations

  const translateMat = matrix4.translate(translation);
  window.translateMat = translateMat;
  `[1   0   0  0
    0   1   0  0
    0   0   1  0
    0, -5 -10  1]
    ]
  `;

  const rotateXMat = matrix4.fromXRotation(rotation[0]);
  const rotateYMat = matrix4.fromYRotation(rotation[1]);
  const rotateZMat = matrix4.fromZRotation(rotation[2]);
  const scaleMat = matrix4.fromScaling(scaling);

  //combine all transformation matrices together to form a final transform matrix: modelMat
  window.modelA = modelMat.slice();
  // == console.log(window.modelA);
  `[1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,]
  `;

  mat4.multiply(modelMat, rotateXMat, scaleMat);
  window.modelX = modelMat.slice();
  // == console.log(window.modelX);
  `[ 2, 0, 0, 0,
     0, 2, 0, 0,
     0, 0, 1, 0,
     0, 0, 0, 1]
  `;
  mat4.multiply(modelMat, rotateYMat, modelMat);
  window.modelY = modelMat.slice();

  `[ 2.1612091064453125, 0, 3.3658838272094727, 0,
     0,                  2, 0,                  0,
    -2.5244128704071045, 0, 1.6209068298339844, 0,
     0,                  0, 0,                  1,`;

  mat4.multiply(modelMat, rotateZMat, modelMat);
  window.modelZ = modelMat.slice();
  `[ 2.1612091064453125, 0, 3.3658838272094727, 0,
     0,                  2, 0,                  0,
    -2.5244128704071045, 0, 1.6209068298339844, 0,
     0,                  0, 0,                  1,]
  `;

  mat4.multiply(modelMat, translateMat, modelMat);
  window.result = modelMat.slice();
  `[ 2.1612091064453125,  0,   3.3658838272094727, 0,
     0,                   2,   0,                  0,
    -2.5244128704071045,  0,   1.6209068298339844, 0,
     0,                  -5, -10,                  1,]`;
};

const createViewProjection = ({ isPerspective, aspectRatio }, props) => {
  // Returns a view matrix
  const createViewMatrix = (eye, centerPos, up, props) => {
    const {
      libs: { mat4 }
    } = props;

    const eyePosition = eye || [2, 2, 4];
    const center = centerPos || [0, 0, 0];
    const upDirection = up || [0, 1, 0];

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, eyePosition, center, upDirection);

    return viewMatrix;
  };

  // Returns a projection matrix
  const perspectiveCam = ({ fovy, aspectRatio, near, far }) => {
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fovy, aspectRatio, near, far);
    return projectionMatrix;
  };

  // Returns a projection matrix
  const orthoCam = ({ fovy, aspectRatio, near, far }) => {
    const projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -4, 4, -3, 3, -1, 6);
    return projectionMatrix;
  };

  const {
    libs: { mat4 }
  } = props;

  // View Matrix
  const eyePosition = [3, 2, 4];
  const center = [0, 0, -2];
  const upDirection = [0, 1, 0];
  const viewMatrix = createViewMatrix(eyePosition, center, upDirection, props);

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

  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

  const cameraOption = {
    eye: eyePosition,
    center,
    zoomMax: 100,
    zoomSpeed: 2
  };

  return {
    // viewMatrix,
    // projectionMatrix,
    viewProjectionMatrix,
    cameraOption
  };
};

const gpuInit = async ({ canvas }) => {
  // Create adapter, device and WebGPU context
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  window.device = device;
  window.context = context;
  window.adapter = adapter;
  // const swapChainFormat = "bgra8unorm";
  const swapChainFormat = context.getPreferredFormat(adapter);

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
  const {
    libs: { mat4, vec3, camera: cam },
    canvas
  } = props;

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
              [[builtin(position)]] Position: vec4<f32>;
              [[location(0)]] vColor: vec4<f32>;
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
            // return vColor;
            return vec4<f32>(0.6, 0.7, 0.6, 1.0);
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
  const viewProjection = createViewProjection(
    {
      isPerspective,
      aspectRatio: canvas.width / canvas.height
    },
    props
  );

  let camera = cam(canvas, viewProjection.cameraOption);

  window.camera = camera;
  `-------------------------------------------------------`;
  `Step 4.2: CREATE uniform buffer and bind group`;

  //
  const sceneUniformBuffer = device.createBuffer({
    size: 4 * 4 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  // line 354: renderPass.setBindGroup(0, sceneUniformBindGroup);
  // The GPUBindGroup specifies the actual buffers or textures
  // that will be passed to the shaders:
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

  const updateCamera = () => {
    updateTransformationMatrix(
      modelMatrix,
      // translation
      [0, -5, -10],
      // rotation
      [1, -3, 0],
      // scaling
      [2, 2, 1],
      props
    );

    mat4.multiply(mvpMatrix, viewProjection.viewProjectionMatrix, modelMatrix);
    device.queue.writeBuffer(
      // destination: Uniform Buffer
      sceneUniformBuffer,
      // offset
      0,
      // source
      mvpMatrix
    );
  };

  const app = {
    loopID: null,
    stopped: false
  };

  function run(f) {
    const frame = t => {
      f();

      // for (const k in app.keyStates) {
      //   app.keyStates[k] = processBtnState(app.keyStates[k]);
      // }

      // app.mouseState = processBtnState(app.mouseState);
      // app.charInputted = [];
      // app.mouseMoved = false;
      app.loopID = requestAnimationFrame(frame);
    };

    app.stopped = false;
    app.loopID = requestAnimationFrame(frame);
  }

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

    updateCamera();

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

  // run(() => draw());
};
