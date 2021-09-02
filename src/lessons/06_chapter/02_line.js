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
  props
) => {
  const {
    math: { mat4 }
  } = props;

  rotation = rotation || [3, 0, 0];
  translation = translation || [0, 0, 0];
  scaling = scaling || [2, 2, 1];

  // inputs
  const scaleMat = matrix4.fromScaling(scaling);
  const rotateXMat = matrix4.fromXRotation(rotation[0]);
  const rotateYMat = matrix4.fromYRotation(rotation[1]);
  const rotateZMat = matrix4.fromZRotation(rotation[2]);
  const translateMat = matrix4.translate(translation);

  mat4.multiply(modelMat, rotateXMat, scaleMat);
  mat4.multiply(modelMat, rotateYMat, modelMat);
  mat4.multiply(modelMat, rotateZMat, modelMat);
  mat4.multiply(modelMat, translateMat, modelMat);
};

const gpuInit = async ({ canvas }) => {
  // Create adapter, device and WebGPU context
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  const swapChainFormat = context.getPreferredFormat(adapter);

  // Configure swap chain
  context.configure({
    device: device,
    format: swapChainFormat
  });

  return {
    device,
    context,
    swapChainFormat
  };
};

export const createGPUBuffer = (
  device, // WebGPUDevice
  input, // Array
  usageFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
) => {
  // 1. Convert array into float32 data
  const data = new Float32Array(input);

  // 2. Create buffer (this object gets returned)
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: usageFlag,
    mappedAtCreation: true
  });

  // 3: Get Access to the Content
  new Float32Array(buffer.getMappedRange()).set(data);

  // 4. Unmap so that data can be used by the GPU
  buffer.unmap();
  return buffer;
};

const createViewProjection = ({ isPerspective, aspectRatio }, props) => {
  // Returns a view matrix
  const createViewMatrix = (eye, centerPos, up, props) => {
    const {
      math: { mat4 }
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
    math: { mat4 }
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
    viewMatrix,
    projectionMatrix,
    viewProjectionMatrix,
    cameraOption
  };
};

function createLine3DData() {
  let data = [];
  for (let i = 0; i < 300; i++) {
    let t = (0.1 * i) / 30;
    let x = Math.exp(-t) * Math.sin(30 * t);
    let z = Math.exp(-t) * Math.cos(30 * t);
    let y = 2 * t - 1;
    // pushing 3 items per loop, total of 900 items
    data.push(x, y, z);
  }
  return data.flat(1);
}

window.createLine3DData = createLine3DData;

export async function createLine(props) {
  const {
    math: { mat4, vec3 },
    canvas
  } = props;
  // console.log("PROPS", props);
  const { device, context, swapChainFormat } = await gpuInit({
    canvas
  });

  window.swapChainFormat = swapChainFormat;

  window.props = props;

  // Create Vertices
  const lineData = createLine3DData();
  const vertexBuffer = createGPUBuffer(device, lineData);

  //create uniform data
  const modelMatrix = mat4.create();
  const mvpMatrix = mat4.create();
  let vMatrix = mat4.create();
  let vpMatrix = mat4.create();
  const viewProjection = createViewProjection(
    { aspectRatio: canvas.width / canvas.height, isPerspective: true },
    props
  );

  vpMatrix = viewProjection.viewProjectionMatrix;
  const camera = props.camera(canvas, viewProjection.cameraOption);

  window.camera = camera;

  `Step 3: CREATE Render Pipeline`;
  const shaders = {
    vertex: `
          [[block]] struct Uniforms {
              mvpMatrix: mat4x4<f32>;
          };
          [[binding(0), group(0)]] var<uniform> uniforms : Uniforms;

          [[stage(vertex)]]
          fn main([[location(0)]] pos: vec4<f32>) ->  [[builtin(position)]] vec4<f32> {
              return uniforms.mvpMatrix * pos;
          }`,

    fragment: `
          [[stage(fragment)]]
          fn main() -> [[location(0)]] vec4<f32> {
              return vec4<f32>(1.0, 1.0, 0.0, 1.0);
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
          arrayStride: 4 * 3,
          attributes: [{ shaderLocation: 0, format: "float32x3", offset: 0 }]
        }
      ]
    },
    fragment: {
      module: device.createShaderModule({
        code: shaders.fragment
      }),
      entryPoint: "main",
      targets: [{ format: swapChainFormat }]
    },
    primitive: {
      topology: "line-strip",
      stripIndexFormat: "uint32"
    }
  });

  //create uniform buffer and bind group
  const sceneUniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

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

  const updateCamera = ({ translation, rotation, scale }) => {
    updateTransformationMatrix(
      modelMatrix,
      translation,
      rotation,
      scale,
      props
    );

    mat4.multiply(mvpMatrix, viewProjection.viewProjectionMatrix, modelMatrix);
    device.queue.writeBuffer(sceneUniformBuffer, 0, mvpMatrix);
  };

  `Step 5: Draw`;
  const controls = {
    translation: [0, 0, 0],
    rotation: [0, 0, 0],
    scaling: [1, 1, 1]
  };
  window.controls = controls;

  const draw = () => {
    // update camera
    updateCamera(controls);

    // render pass
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadValue: [0.5, 0.5, 0.8, 1],
          storeOp: "store"
        }
      ]
    });
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setBindGroup(0, sceneUniformBindGroup);
    renderPass.draw(300, 1, 0, 0);
    renderPass.endPass();

    // 8. submit
    device.queue.submit([commandEncoder.finish()]);
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

  run(() => draw());
}
