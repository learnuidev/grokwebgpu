async function initGPU({ canvas }) {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");

  const swapChainFormat = context.getPreferredFormat(adapter);

  context.configure({
    device: device,
    format: swapChainFormat
  });

  return {
    device,
    swapChainFormat,
    context
  };
}

function createGPUBuffer(
  device,
  input,
  usageFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
) {
  const data = new Float32Array(input);
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: usageFlag,
    mappedAtCreation: true
  });
  new Float32Array(buffer.getMappedRange()).set(data);
  buffer.unmap();
  return buffer;
}

export const initTexture = async ({ canvas, debug, gui, image }) => {
  const { device, swapChainFormat, context } = await initGPU({ canvas });
};
