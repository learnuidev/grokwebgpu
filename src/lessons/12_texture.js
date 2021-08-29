const graphicsShader = `
[[group(0), binding(0)]] var mySampler : sampler;
[[group(0), binding(1)]] var myTexture : texture_2d<f32>;

struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] fragUV : vec2<f32>;
};

[[stage(vertex)]]
fn vert_main([[builtin(vertex_index)]] VertexIndex : u32) -> VertexOutput {
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

  var output : VertexOutput;
  output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
  output.fragUV = uv[VertexIndex];
  return output;
}

[[stage(fragment)]]
fn frag_main([[location(0)]] fragUV : vec2<f32>) -> [[location(0)]] vec4<f32> {
  return textureSample(myTexture, mySampler, fragUV);
}
`;

const computeShader = `
[[block]] struct Params {
  filterDim : u32;
  blockDim : u32;
};

[[group(0), binding(0)]] var samp : sampler;
[[group(0), binding(1)]] var<uniform> params : Params;
[[group(1), binding(1)]] var inputTex : texture_2d<f32>;
[[group(1), binding(2)]] var outputTex : texture_storage_2d<rgba8unorm, write>;

[[block]] struct Flip {
  value : u32;
};
[[group(1), binding(3)]] var<uniform> flip : Flip;

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

export const initTexture = async ({ canvas, debug }) => {
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
  const blurPipeline = device.createComputePipeline({
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
  });

  // image code
  // throws cors error when url is directly used
  let imageUrl =
    "http://austin-eng.com/webgpu-samples/_next/static/e04932ba9c013b60ddb249577c386914.png";
  imageUrl = "assets/image.png";

  const img = document.createElement("img");
  img.src = imageUrl;
  await img.decode();
  const imageBitmap = await createImageBitmap(img);

  // create texture
  const [srcWidth, srcHeight] = [imageBitmap.width, imageBitmap.height];
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
    layout: blurPipeline.getBindGroupLayout(0),
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
    layout: blurPipeline.getBindGroupLayout(1),
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
    layout: blurPipeline.getBindGroupLayout(1),
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
    layout: blurPipeline.getBindGroupLayout(1),
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
    filterSize: 1,
    iterations: 2
  };

  let blockDim;
  //
  const updateSettings = () => {
    blockDim = tileDim - (settings.filterSize - 1);
    device.queue.writeBuffer(
      blurParamsBuffer,
      0,
      new Uint32Array([settings.filterSize, blockDim])
    );
  };

  updateSettings();

  function frame() {
    // Sample is no longer the active page.
    if (!canvas) return;

    const commandEncoder = device.createCommandEncoder();

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(blurPipeline);
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

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          storeOp: "store"
        }
      ]
    });

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, showResultBindGroup);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.endPass();
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
    blurPipeline,
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
