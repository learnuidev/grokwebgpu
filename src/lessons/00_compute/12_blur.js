const graphicsShader = `
struct VertexOutput {
  [[builtin(position)]] pos: vec4<f32>;
  [[location(0)]] uv: vec2<f32>;
};

[[stage(vertex)]]
fn vert_main([[builtin(vertex_index)]] vIndex: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
      vec2<f32>( 1.0,  1.0),
      vec2<f32>( 1.0, -1.0),
      vec2<f32>(-1.0, -1.0),
      vec2<f32>( 1.0,  1.0),
      vec2<f32>(-1.0, -1.0),
      vec2<f32>(-1.0,  1.0));

  var uv = array<vec2<f32>, 6>(
      vec2<f32>(1.0, 0.0),
      vec2<f32>(1.0, 1.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(1.0, 0.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(0.0, 0.0));

  var output: VertexOutput;
  output.pos = vec4<f32>(pos[vIndex], 0.0, 1.0);
  output.uv = uv[vIndex];
  return output;
}


[[group(0), binding(0)]] var mySampler: sampler;
[[group(0), binding(1)]] var myTexture: texture_2d<f32>;

[[stage(fragment)]]
fn frag_main(input: VertexOutput) -> [[location(0)]] vec4<f32> {
  return textureSample(myTexture, mySampler, input.uv);
}
`;

const computeShader = `
[[block]] struct Params {
  filterDim : u32;
  blockDim : u32;
};

[[group(0), binding(0)]] var samp: sampler;
[[group(0), binding(1)]] var<uniform> params: Params;

[[group(1), binding(1)]] var inputTex: texture_2d<f32>;
[[group(1), binding(2)]] var outputTex: texture_storage_2d<rgba8unorm, write>;

[[block]] struct Flip {
  value : u32;
};
[[group(1), binding(3)]] var<uniform> flip: Flip;

// This shader blurs the input texture in one direction, depending on whether
// |flip.value| is 0 or 1.
// It does so by running (128 / 4) threads per workgroup to load 128
// texels into 4 rows of shared memory. Each thread loads a
// 4 x 4 block of texels to take advantage of the texture sampling
// hardware.
// Then, each thread computes the blur result by averaging the adjacent texel values
// in shared memory.
// Because we're operating on a subset of the texture, we cannot compute all of the
// results since not all of the neighbors are available in shared memory.
// Specifically, with 128 x 128 tiles, we can only compute and write out
// square blocks of size 128 - (filterSize - 1). We compute the number of blocks
// needed in Javascript and dispatch that amount.

var<workgroup> tile : array<array<vec3<f32>, 128>, 4>;

[[stage(compute), workgroup_size(32, 1, 1)]]
fn main(
  [[builtin(workgroup_id)]] WorkGroupID : vec3<u32>,
  [[builtin(local_invocation_id)]] LocalInvocationID : vec3<u32>
) {
  let filterOffset : u32 = (params.filterDim - 1u) / 2u;
  let dims : vec2<i32> = textureDimensions(inputTex, 0);

  let baseIndex = vec2<i32>(
    WorkGroupID.xy * vec2<u32>(params.blockDim, 4u) +
    LocalInvocationID.xy * vec2<u32>(4u, 1u)
  ) - vec2<i32>(i32(filterOffset), 0);

  for (var r : u32 = 0u; r < 4u; r = r + 1u) {
    for (var c : u32 = 0u; c < 4u; c = c + 1u) {
      var loadIndex = baseIndex + vec2<i32>(i32(c), i32(r));
      if (flip.value != 0u) {
        loadIndex = loadIndex.yx;
      }

      tile[r][4u * LocalInvocationID.x + c] =
        textureSampleLevel(inputTex, samp,
          (vec2<f32>(loadIndex) + vec2<f32>(0.25, 0.25)) / vec2<f32>(dims), 0.0).rgb;
    }
  }

  workgroupBarrier();

  for (var r : u32 = 0u; r < 4u; r = r + 1u) {
    for (var c : u32 = 0u; c < 4u; c = c + 1u) {
      var writeIndex = baseIndex + vec2<i32>(i32(c), i32(r));
      if (flip.value != 0u) {
        writeIndex = writeIndex.yx;
      }

      let center : u32 = 4u * LocalInvocationID.x + c;
      if (center >= filterOffset &&
          center < 128u - filterOffset &&
          all(writeIndex < dims)) {
        var acc : vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
        for (var f : u32 = 0u; f < params.filterDim; f = f + 1u) {
          var i : u32 = center + f - filterOffset;
          acc = acc + (1.0 / f32(params.filterDim)) * tile[r][i];
        }
        textureStore(outputTex, writeIndex, vec4<f32>(acc, 1.0));
      }
    }
  }
}
`;

// Contants from the blur.wgsl shader.
const tileDim = 128;
const batch = [4, 4];

export const initBlur = async ({ canvas, debug, gui, image }) => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  // context
  const context = canvas.getContext("webgpu");

  const devicePixelRatio = window.devicePixelRatio || 1;
  const presentationSize = [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio
  ];

  // Needed for correctly viewing image
  canvas.height = 600;
  canvas.width = 600;

  const presentationFormat = context.getPreferredFormat(adapter);

  // swap chain
  context.configure({
    device,
    format: presentationFormat,
    size: presentationSize
  });

  // Pipelines
  // 1. Compute Pipeline: Blur Example
  const computeShaderModule = device.createShaderModule({
    code: computeShader
  });
  const computePipeline = device.createComputePipeline({
    compute: {
      module: computeShaderModule,
      entryPoint: "main"
    }
  });

  // 2. Render Pipeline
  const renderPipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: graphicsShader
      }),
      entryPoint: "vert_main"
    },
    fragment: {
      module: device.createShaderModule({
        code: graphicsShader
      }),
      entryPoint: "frag_main",
      targets: [
        {
          format: presentationFormat
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    }
  });

  // Texture ===
  // sampler
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear"
    // mipmapFilter: "linear"
    // addressModeU: "repeat",
    // addressModeV: "repeat"
    // addressModeU: "mirror-repeat",
    // addressModeV: "mirror-repeat"
    // addressModeU: "clamp-to-edge",
    // addressModeV: "clamp-to-edge"
  });

  /*
    Here, the GPUAddressMode property describes the behavior of the
    sampler if the sample footprint extends beyond the bounds of the
    sample texture.

    There is a separate address mode for each direction in the texture coordinate system.
    The address mode has three options:
    - clamp-to-edge: Texture coordinates are clamped between [0, 1].
    - repeat: Texture coordinates wrap to the other side of the texture.
    - mirror-repeat: Texture coordinates wrap to the other side of the texture, but the
      texture is flipped when the integer part of the coordinate is odd.

    The mirror-repeat mode can eliminate visible seams between the
    texture copies. In WebGPU, texture coordinates are usually input
    to the vertex shader as an attribute of type vec2.
    They are communicated to the fragment shader in a varying
    variable. The vertex shader will then copy the value of the
    attribute into the varying variable. In fragment shader, we use the
    texture coordinates to sample a texture. The WGSL function for
    sampling an ordinary texture can be expressed as:

    textureSample(textureData, textureSampler, textureCoordinates);

  */
  async function getImageBitmap(imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    await img.decode();
    return await createImageBitmap(img);
  }

  // create texture
  // step 1: Image
  // image code
  // throws cors error when url is directly used
  let imageUrl =
    "http://austin-eng.com/webgpu-samples/_next/static/e04932ba9c013b60ddb249577c386914.png";
  imageUrl = image || "assets/image.png";

  const imageBitmap = await getImageBitmap(imageUrl);
  // const imageBitmap = await getImageBitmap(image);
  const [srcWidth, srcHeight] = [imageBitmap.width, imageBitmap.height];
  // const [srcWidth, srcHeight] = [100, 100];

  // step 2: texture
  const imageTexture = device.createTexture({
    size: [srcWidth, srcHeight, 1],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: imageTexture },
    [srcWidth, srcHeight]
  );

  const textures = [0, 1].map(() => {
    return device.createTexture({
      size: {
        width: srcWidth,
        height: srcHeight
      },
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.TEXTURE_BINDING
    });
  });

  // Buffers
  const buffer0 = (() => {
    const buffer = device.createBuffer({
      size: 4,
      mappedAtCreation: true,
      usage: GPUBufferUsage.UNIFORM
    });
    new Uint32Array(buffer.getMappedRange())[0] = 0;
    buffer.unmap();
    return buffer;
  })();

  const buffer1 = (() => {
    const buffer = device.createBuffer({
      size: 4,
      mappedAtCreation: true,
      usage: GPUBufferUsage.UNIFORM
    });
    new Uint32Array(buffer.getMappedRange())[0] = 1;
    buffer.unmap();
    return buffer;
  })();

  //
  const blurParamsBuffer = device.createBuffer({
    size: 8,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
  });

  // Bind Group
  const computeConstants = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: sampler
      },
      {
        binding: 1,
        resource: {
          buffer: blurParamsBuffer
        }
      }
    ]
  });

  const computeBindGroup0 = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 1,
        resource: imageTexture.createView()
      },
      {
        binding: 2,
        resource: textures[0].createView()
      },
      {
        binding: 3,
        resource: {
          buffer: buffer0
        }
      }
    ]
  });

  const computeBindGroup1 = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 1,
        resource: textures[0].createView()
      },
      {
        binding: 2,
        resource: textures[1].createView()
      },
      {
        binding: 3,
        resource: {
          buffer: buffer1
        }
      }
    ]
  });

  const computeBindGroup2 = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 1,
        resource: textures[1].createView()
      },
      {
        binding: 2,
        resource: textures[0].createView()
      },
      {
        binding: 3,
        resource: {
          buffer: buffer0
        }
      }
    ]
  });

  const showResultBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: sampler
      },
      {
        binding: 1,
        resource: textures[1].createView()
      }
    ]
  });

  const settings = {
    // filterSize: 15,
    // iterations: 2
    filterSize: 10,
    iterations: 2
  };

  const calcBlockDim = filterSize => {
    return tileDim - (filterSize - 1);
  };

  let blockDim;
  //
  const updateSettings = () => {
    blockDim = calcBlockDim(settings.filterSize);
    window.blockDim = blockDim;

    device.queue.writeBuffer(
      blurParamsBuffer,
      0,
      new Uint32Array([settings.filterSize, blockDim])
    );
  };

  gui
    .add(settings, "filterSize", 1, 33)
    .step(2)
    .onChange(updateSettings);
  gui.add(settings, "iterations", 1, 10).step(1);

  updateSettings();

  function updateCompute(commandEncoder) {
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeConstants);

    computePass.setBindGroup(1, computeBindGroup0);
    computePass.dispatch(
      Math.ceil(srcWidth / blockDim),
      Math.ceil(srcHeight / batch[1])
    );

    computePass.setBindGroup(1, computeBindGroup1);
    computePass.dispatch(
      Math.ceil(srcHeight / blockDim),
      Math.ceil(srcWidth / batch[1])
    );

    for (let i = 0; i < settings.iterations - 1; ++i) {
      computePass.setBindGroup(1, computeBindGroup2);
      computePass.dispatch(
        Math.ceil(srcWidth / blockDim),
        Math.ceil(srcHeight / batch[1])
      );

      computePass.setBindGroup(1, computeBindGroup1);
      computePass.dispatch(
        Math.ceil(srcHeight / blockDim),
        Math.ceil(srcWidth / batch[1])
      );
    }

    computePass.endPass();
  }

  function updateDrawing(commandEncoder) {
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          storeOp: "store"
        }
      ]
    });

    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, showResultBindGroup);
    renderPass.draw(6, 1, 0, 0);
    renderPass.endPass();
  }

  function frame() {
    // Sample is no longer the active page.
    if (!canvas) return;

    const commandEncoder = device.createCommandEncoder();
    updateCompute(commandEncoder);
    updateDrawing(commandEncoder);
    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const ctx = {
    device,
    canvas,
    presentationFormat,
    presentationSize,
    // comptute pipeline
    computeShader,
    computePipeline,
    // graphics pipeline
    graphicsShader,
    renderPipeline,
    // texture
    // sampler
    sampler,
    imageBitmap,
    imageTexture,
    textures,
    // Buffers,
    buffer0,
    buffer1,
    // bind groups
    computeConstants,
    computeBindGroup0,
    computeBindGroup1,
    computeBindGroup2,
    showResultBindGroup
  };

  if (debug) {
    for (const item in ctx) {
      window[item] = ctx[item];
    }
  }

  return ctx;
};
