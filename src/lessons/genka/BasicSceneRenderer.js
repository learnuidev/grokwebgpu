// TODO:
// 1. camera.ts - done
// 2. index.ts -
// 3. objects.ts - DONE
// 4. renderer.ts - DONE
// 5. scene.ts - DONE
// 5. vertices - DONE

`Module: 1: Camera ====`;

// GLOBAL Objects
let device;
let props;

function setProps(p) {
  props = p;
}

export function Camera({ x, y, z, rotX, rotY, rotZ, fovy, aspect, near, far }) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.rotX = rotX || 0;
  this.rotY = rotY || 0;
  this.rotZ = rotZ || 0;

  this.fovy = fovy || (2 * Math.PI) / 5;
  this.aspect = aspect || 16 / 9;

  this.near = near || 1;
  this.far = far || 1000;
}

// Private
Camera.prototype.getViewMatrix = function () {
  const { mat4, vec3 } = props.libs;

  let viewMatrix = mat4.create();

  mat4.lookAt(
    viewMatrix,
    vec3.fromValues(this.x, this.y, this.z), // eye - p camera position/point - point where our camera is
    vec3.fromValues(0, 0, 0), // center - direction at which the camera is pointing (out direction)
    vec3.fromValues(0, 1, 0) // specify up direction vector - useful for tilting
  );

  mat4.rotateX(viewMatrix, viewMatrix, this.rotX);
  mat4.rotateY(viewMatrix, viewMatrix, this.rotY);
  mat4.rotateZ(viewMatrix, viewMatrix, this.rotZ);
  return viewMatrix;
};

// Private
Camera.prototype.getProjectionMatrix = function () {
  const { mat4 } = props.libs;
  let projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    this.fovy,
    this.aspect,
    this.near,
    this.far
  );
  return projectionMatrix;
};

Camera.prototype.getCameraViewProjMatrix = function () {
  const { mat4 } = props.libs;

  const viewProjMatrix = mat4.create();
  const view = this.getViewMatrix();
  const proj = this.getProjectionMatrix();

  return mat4.multiply(viewProjMatrix, proj, view);
};

`Module: 2: Vertices ====`;

// Cube
const cubeVertexCount = 36;
// prettier-ignore
const cubeVertexArray = new Float32Array([
  // float4 position, float4 color, float2 uv,
  [1, -1, 1, 1,   1, 0, 1, 1,  1, 1],
  [-1, -1, 1, 1,  0, 0, 1, 1,  0, 1],
  [-1, -1, -1, 1, 0, 0, 0, 1,  0, 0],
  [1, -1, -1, 1,  1, 0, 0, 1,  1, 0],
  [1, -1, 1, 1,   1, 0, 1, 1,  1, 1],
  [-1, -1, -1, 1, 0, 0, 0, 1,  0, 0],

  [1, 1, 1, 1,    1, 1, 1, 1,  1, 1],
  [1, -1, 1, 1,   1, 0, 1, 1,  0, 1],
  [1, -1, -1, 1,  1, 0, 0, 1,  0, 0],
  [1, 1, -1, 1,   1, 1, 0, 1,  1, 0],
  [1, 1, 1, 1,    1, 1, 1, 1,  1, 1],
  [1, -1, -1, 1,  1, 0, 0, 1,  0, 0],

  [-1, 1, 1, 1,   0, 1, 1, 1,  1, 1],
  [1, 1, 1, 1,    1, 1, 1, 1,  0, 1],
  [1, 1, -1, 1,   1, 1, 0, 1,  0, 0],
  [-1, 1, -1, 1,  0, 1, 0, 1,  1, 0],
  [-1, 1, 1, 1,   0, 1, 1, 1,  1, 1],
  [1, 1, -1, 1,   1, 1, 0, 1,  0, 0],

  [-1, -1, 1, 1,  0, 0, 1, 1,  1, 1],
  [-1, 1, 1, 1,   0, 1, 1, 1,  0, 1],
  [-1, 1, -1, 1,  0, 1, 0, 1,  0, 0],
  [-1, -1, -1, 1, 0, 0, 0, 1,  1, 0],
  [-1, -1, 1, 1,  0, 0, 1, 1,  1, 1],
  [-1, 1, -1, 1,  0, 1, 0, 1,  0, 0],

  [1, 1, 1, 1,    1, 1, 1, 1,  1, 1],
  [-1, 1, 1, 1,   0, 1, 1, 1,  0, 1],
  [-1, -1, 1, 1,  0, 0, 1, 1,  0, 0],
  [-1, -1, 1, 1,  0, 0, 1, 1,  0, 0],
  [1, -1, 1, 1,   1, 0, 1, 1,  1, 0],
  [1, 1, 1, 1,    1, 1, 1, 1,  1, 1],

  [1, -1, -1, 1,  1, 0, 0, 1,  1, 1],
  [-1, -1, -1, 1, 0, 0, 0, 1,  0, 1],
  [-1, 1, -1, 1,  0, 1, 0, 1,  0, 0],
  [1, 1, -1, 1,   1, 1, 0, 1,  1, 0],
  [1, -1, -1, 1,  1, 0, 0, 1,  1, 1],
  [-1, 1, -1, 1,  0, 1, 0, 1,  0, 0],
].flat());

// Pyramid (Triangle)
const triangleVertexCount = 19;
// prettier-ignore
const triangleVertexArray = new Float32Array([
  // float4 position, float4 color, float2 uv,
  [0, 1, 0, 1,    0, 0, 1, 1,  1, 1],
  [-1, -1, 1, 1,  0, 0, 1, 1,  1, 1],
  [1, -1, 1, 1,   0, 0, 1, 1,  1, 1],

  [1, -1, -1, 1,  0, 1, 0, 1,  1, 1],
  [0, 1, 0, 1,    0, 1, 0, 1,  1, 1],
  [1, -1, 1, 1,   0, 1, 0, 1,  1, 1],

  [-1, -1, -1, 1,  1, 1, 0, 1,  1, 1],
  [1, -1, -1, 1,   1, 1, 0, 1,  1, 1],
  [1, -1, 1, 1,    1, 1, 0, 1,  1, 1],

  [-1, -1, 1, 1,   0, 1, 1, 1,  1, 1],
  [-1, -1, -1, 1,  0, 1, 1, 1,  1, 1],
  [1, -1, 1, 1,    0, 1, 1, 1,  1, 1],

  [-1, -1, -1, 1,  1, 0.5, 0, 1,  1, 1], // bridg]e

  [-1, -1, 1, 1,   1, 0.5, 0, 1,  1, 1],
  [0, 1, 0, 1,     1, 0.5, 0, 1,  1, 1],
  [-1, -1, -1, 1,  1, 0.5, 0, 1,  1, 1],

  [0, 1, 0, 1,    1, 0, 0, 1,  1, 1],
  [1, -1, -1, 1,  1, 0, 0, 1,  1, 1],
  [-1, -1, -1, 1, 1, 0, 0, 1,  1, 1],
].flat());

`Module 3: Scene ===`;

export function Scene() {
  this.objects = [];
}

Scene.prototype.add = function (object) {
  this.objects.push(object);
};

Scene.prototype.getObjects = function (object) {
  return this.objects;
};

`Module 4: Objects ===`;
const wgslShaders = {
  vertex: `
  [[block]] struct Uniforms {
    modelViewProjectionMatrix : mat4x4<f32>;
  };

  [[binding(0), group(0)]] var<uniform> uniforms : Uniforms;

  struct VertexOutput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0)]] fragColor : vec4<f32>;
  };

  [[stage(vertex)]]
  fn main([[location(0)]] position : vec4<f32>,
          [[location(1)]] color : vec4<f32>) -> VertexOutput {
    return VertexOutput(uniforms.modelViewProjectionMatrix * position, color);
  }
  `,
  fragment: `
  [[stage(fragment)]]
  fn main([[location(0)]] fragColor : vec4<f32>) -> [[location(0)]] vec4<f32> {
    return fragColor;
  }
  `,
};

const positionOffset = 0;
const colorOffset = 4 * 4; // Byte offset of object color attribute.
const vertexSize = 4 * 10; // Byte size of one object.

export function RenderObject(
  device,
  verticesArray,
  vertexCount,
  parameter = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 }
) {
  this.device = device;

  this.x = parameter.x || 0;
  this.y = parameter.y || 0;
  this.z = parameter.z || 0;

  this.rotX = parameter.rotX || 0;
  this.rotY = parameter.rotY || 0;
  this.rotZ = parameter.rotZ || 0;

  this.matrixSize = 4 * 16; // 4x4 matrix
  this.offset = 256; // uniformBindGroup offset must be 256-byte aligned
  this.uniformBufferSize = this.offset + this.matrixSize;

  this.modelViewProjectionMatrix = props.libs.mat4.create();

  // CONSTRUCTOR
  this.vertexCount = vertexCount;
  this.renderPipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: wgslShaders.vertex,
      }),
      entryPoint: "main",
      buffers: [
        {
          arrayStride: vertexSize,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: positionOffset,
              format: "float32x4",
            },
            {
              // color
              shaderLocation: 1,
              offset: colorOffset,
              format: "float32x4",
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: wgslShaders.fragment,
      }),
      entryPoint: "main",
      targets: [
        {
          format: "bgra8unorm",
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back",
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus-stencil8",
    },
  });

  this.uniformBuffer = device.createBuffer({
    size: this.uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  this.uniformBindGroup = device.createBindGroup({
    layout: this.renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: this.uniformBuffer,
          offset: 0,
          size: this.matrixSize,
        },
      },
    ],
  });

  this.verticesBuffer = device.createBuffer({
    size: verticesArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(this.verticesBuffer.getMappedRange()).set(verticesArray);
  this.verticesBuffer.unmap();

  this.setTransformation(parameter);
}

function cube(parameter) {
  return new RenderObject(device, cubeVertexArray, cubeVertexCount, parameter);
}

function pyramid(parameter) {
  return new RenderObject(
    device,
    triangleVertexArray,
    triangleVertexCount,
    parameter
  );
}

RenderObject.prototype.draw = function (passEncoder, device, camera) {
  this.updateTransformationMatrix(camera.getCameraViewProjMatrix());

  passEncoder.setPipeline(this.renderPipeline);
  device.queue.writeBuffer(
    this.uniformBuffer,
    0,
    this.modelViewProjectionMatrix.buffer,
    this.modelViewProjectionMatrix.byteOffset,
    this.modelViewProjectionMatrix.byteLength
  );
  passEncoder.setVertexBuffer(0, this.verticesBuffer);
  passEncoder.setBindGroup(0, this.uniformBindGroup);
  passEncoder.draw(this.vertexCount, 1, 0, 0);
};
// Private
// 20/08/2021 - Question: Why do we need this?
// 22/08/2021 - gets used in `RenderObject.prototype.draw
RenderObject.prototype.updateTransformationMatrix = function (
  cameraProjectionMatrix
) {
  const { mat4, vec3 } = props.libs;
  // MOVE / TRANSLATE OBJECT
  const modelMatrix = mat4.create();
  mat4.translate(
    modelMatrix,
    modelMatrix,
    vec3.fromValues(this.x, this.y, this.z)
  );
  mat4.rotateX(modelMatrix, modelMatrix, this.rotX);
  mat4.rotateY(modelMatrix, modelMatrix, this.rotY);
  mat4.rotateZ(modelMatrix, modelMatrix, this.rotZ);

  // PROJECT ON CAMERA
  mat4.multiply(
    this.modelViewProjectionMatrix,
    cameraProjectionMatrix, // C
    modelMatrix // x y z - rotated and translated model matrix
  );
};

// Private
// 20/08/2021 - Question: Why do we need this?
// 22/08/2021 - Answer: gets used in RenderObject. last line
RenderObject.prototype.setTransformation = function (parameter) {
  if (parameter == null) {
    return;
  }

  this.x = parameter.x ? parameter.x : 0;
  this.y = parameter.y ? parameter.y : 0;
  this.z = parameter.z ? parameter.z : 0;

  this.rotX = parameter.rotX ? parameter.rotX : 0;
  this.rotY = parameter.rotY ? parameter.rotY : 0;
  this.rotZ = parameter.rotZ ? parameter.rotZ : 0;
};

`Module 5: WebGPU Renderer ===`;

export function WebGPURenderer() {
  this.swapChainFormat = "bgra8unorm";
  this.initSuccess = false;
}

// DONE

WebGPURenderer.prototype.init = async function (canvas) {
  if (!canvas) {
    console.log("missing canvas!");
    return false;
  }

  const adapter = await navigator.gpu.requestAdapter();
  device = await adapter.requestDevice();
  this.device = device;

  if (!this.device) {
    console.log("found no gpu device!");
    return false;
  }

  this.context = canvas.getContext("webgpu");

  this.presentationFormat = this.context.getPreferredFormat(adapter);
  this.presentationSize = [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio,
  ];

  this.context.configure({
    device: this.device,
    format: this.presentationFormat,
    size: this.presentationSize,
  });
  const depthTextureView = this.depthTextureView();
  this.renderPassDescriptor = {
    colorAttachments: [
      {
        // attachment is acquired and set in render loop.
        view: undefined,
        loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
      },
    ],
    depthStencilAttachment: {
      view: depthTextureView,

      depthLoadValue: 1.0,
      depthStoreOp: "store",
      stencilLoadValue: 0,
      stencilStoreOp: "store",
    },
  };

  return (this.initSuccess = true);
};

// DONE
WebGPURenderer.prototype.update = function (canvas) {
  if (!this.initSuccess) {
    return;
  }

  this.updateRenderPassDescriptor(canvas);
};

// DONE
WebGPURenderer.prototype.frame = function (camera, scene) {
  if (!this.initSuccess) {
    return;
  }

  this.renderPassDescriptor.colorAttachments[0].view = this.context
    .getCurrentTexture()
    .createView();

  const commandEncoder = this.device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);

  for (let object of scene.getObjects()) {
    object.draw(passEncoder, this.device, camera);
  }

  passEncoder.endPass();
  this.device.queue.submit([commandEncoder.finish()]);
};

// DONE
WebGPURenderer.prototype.depthTextureView = function () {
  return this.device
    .createTexture({
      size: this.presentationSize,
      format: "depth24plus-stencil8",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
    .createView();
};

// DONE
WebGPURenderer.prototype.updateRenderPassDescriptor = function () {
  this.renderPassDescriptor.depthStencilAttachment.view =
    this.depthTextureView();
};

// APP
export function patu(props) {
  setProps(props);

  const outputCanvas = props.canvas;
  outputCanvas.width = window.innerWidth;
  outputCanvas.height = window.innerHeight;
  document.body.appendChild(outputCanvas);

  const camera = new Camera({
    aspect: outputCanvas.width / outputCanvas.height,
  });
  camera.z = 7;
  const scene = new Scene();

  const renderer = new WebGPURenderer();
  renderer.init(props.canvas).then((success) => {
    if (!success) return;

    scene.add(cube({ x: -2, y: 1 }));
    scene.add(pyramid({ x: 2 }));

    const doFrame = () => {
      // ANIMATE
      const now = Date.now() / 1000;
      window.scene = scene;
      for (let object of scene.getObjects()) {
        // stops rotation of objects
        object.rotX = Math.sin(now);
        // object.rotZ = Math.cos(now);
      }

      // RENDER
      renderer.frame(camera, scene);
      requestAnimationFrame(doFrame);
    };
    requestAnimationFrame(doFrame);
  });

  window.onresize = () => {
    outputCanvas.width = window.innerWidth;
    outputCanvas.height = window.innerHeight;
    camera.aspect = outputCanvas.width / outputCanvas.height;
    renderer.update(outputCanvas);
  };

  function addCube() {
    scene.add(
      cube({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 10,
      })
    );
  }

  function addPyramid() {
    scene.add(
      pyramid({
        x: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
      })
    );
  }

  // BUTTONS
  const boxB = document.createElement("button");
  boxB.textContent = "ADD BOX";
  boxB.classList.add("cubeButton");
  boxB.onclick = addCube;
  document.body.appendChild(boxB);

  const pyramidB = document.createElement("button");
  pyramidB.textContent = "ADD PYRAMID";
  pyramidB.classList.add("pyramidButton");
  pyramidB.onclick = addPyramid;
  document.body.appendChild(pyramidB);

  // MOUSE CONTROLS

  // ZOOM
  outputCanvas.onwheel = (event) => {
    camera.z += event.deltaY / 100;
  };

  // MOUSE DRAG
  var mouseDown = false;
  outputCanvas.onmousedown = (event) => {
    mouseDown = true;

    lastMouseX = event.pageX;
    lastMouseY = event.pageY;
  };

  outputCanvas.onmouseup = (event) => {
    mouseDown = false;
  };

  var lastMouseX = -1;
  var lastMouseY = -1;
  outputCanvas.onmousemove = (event) => {
    if (!mouseDown) {
      return;
    }

    var mousex = event.pageX;
    var mousey = event.pageY;

    if (lastMouseX > 0 && lastMouseY > 0) {
      const roty = mousex - lastMouseX;
      const rotx = mousey - lastMouseY;

      camera.rotY += roty / 100;
      camera.rotX += rotx / 100;
    }

    lastMouseX = mousex;
    lastMouseY = mousey;
  };
}
