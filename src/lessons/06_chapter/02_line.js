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

function createLine3DData() {
  let data = [];
  for (let i = 0; i < 300; i++) {
    let t = (0.1 * i) / 30;
    let x = Math.exp(-t) * Math.sin(30 * t);
    let z = Math.exp(-t) * Math.cos(30 * t);
    let y = 2 * t - 1;
    data.push(x, y, z);
  }
  return data.flat(1);
}

export async function createLine(props) {
  // console.log("PROPS", props);
  const { device, context, swapChainFormat } = await gpuInit({
    canvas: props.canvas
  });

  const lineData = createLine3DData();

  console.log("LINE", lineData);
}
