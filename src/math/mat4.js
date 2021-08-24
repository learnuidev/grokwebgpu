// const EPSILON = 0.000001;
// const EPSILON = Number.EPSILON;
// EPSILON explanation = https://www.youtube.com/watch?v=og7hOFypKpQ

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function create() {
  let out = new Float32Array(16);
  return identity(out);
}

// co tangent function
function cotan(x) {
  return 1 / Math.tan(x);
}

/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspective(
  out,
  fovy = (2 * Math.PI) / 5,
  aspect = 16 / 9,
  near = 1,
  far = 1000
) {
  const f = cotan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;

  out[8] = 0;
  out[9] = 0;
  out[11] = -1;

  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    //
    const nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */
function translate(out, a, v) {
  let x = v[0],
    y = v[1],
    z = v[2];
  let a00, a01, a02, a03;
  let a10, a11, a12, a13;
  let a20, a21, a22, a23;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;

    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}

function multiply(out, a, b) {
  let a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  let a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  let a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  let a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  // Cache only the current line of the second matrix
  let b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

` Clipping:
- We stick to the pinhole camera
Parameters
// Camera Orientation
- Camera Point (eye)
- Viewing Direction Vector (or Center of Attention  = center - eye)
- Up Direction (up)

// View Layout
- Angle of View (fov)
- near and far distance

First three are used to help us orient the camera corrently
Last two helps with getting the perspective view
`;
function lookAt(out, eye, center, up) {
  let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  let eyex = eye[0];
  let eyey = eye[1];
  let eyez = eye[2];
  let upx = up[0];
  let upy = up[1];
  let upz = up[2];
  let centerx = center[0];
  let centery = center[1];
  let centerz = center[2];

  if (
    Math.abs(eyex - centerx) < Number.EPSILON &&
    Math.abs(eyey - centery) < Number.EPSILON &&
    Math.abs(eyez - centerz) < Number.EPSILON
  ) {
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;

  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;

  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;

  len = Math.hypot(y0, y1, y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;

  return out;
}

`===================== Rotation =======================`;

/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function rotate(out, a, rad, axis) {
  let x = axis[0],
    y = axis[1],
    z = axis[2];
  let len = Math.hypot(x, y, z);
  let s, c, t;
  let a00, a01, a02, a03;
  let a10, a11, a12, a13;
  let a20, a21, a22, a23;
  let b00, b01, b02;
  let b10, b11, b12;
  let b20, b21, b22;

  if (len < Number.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;

  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;

  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11];

  // Construct the elements of the rotation matrix
  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c;

  // Perform rotation-specific matrix multiplication
  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  return out;
}

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateX(out, a, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  let a10 = a[4];
  let a11 = a[5];
  let a12 = a[6];
  let a13 = a[7];
  let a20 = a[8];
  let a21 = a[9];
  let a22 = a[10];
  let a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateY(out, a, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  let a00 = a[0];
  let a01 = a[1];
  let a02 = a[2];
  let a03 = a[3];
  let a20 = a[8];
  let a21 = a[9];
  let a22 = a[10];
  let a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateZ(out, a, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  let a00 = a[0];
  let a01 = a[1];
  let a02 = a[2];
  let a03 = a[3];
  let a10 = a[4];
  let a11 = a[5];
  let a12 = a[6];
  let a13 = a[7];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}

// DEMO
devicePixelRatio = window.devicePixelRatio || 1;
presentationSize = [640 * devicePixelRatio, 320 * devicePixelRatio];
aspect = presentationSize[0] / presentationSize[1];
projectionMatrix = create();
perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);

// LECTURE
// truncated pyramid => non truncated pyramid (cube)
const createPrespectiveMatrix = (a, b) => {
  // prettier-ignore
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, a, -1,
    0, 0, b, 0
  ]
};

`a and b are a lot more complicated than what they look like
notice what i have done right now. notice what the last column is with this matrix
 0
 0
-1
 0

 const matrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, a, -1,
    0, 0, b, 1
  ]

Lets say that we have a point somewhere in the pyramid... lets say point = [x y z 1].
This point is a vector of four elements.

If we take this vector point and mutiply it with 4x4 matrix shown above, then result is a vector of
four elements: [x y az + b, -z]

Steps:

1.                 V

              [ 1, 0, 0, 0, 
                0, 1, 0, 0,
[x y z 1]   x   0, 0, a, -1,
                0, 0, b, 0]

= [x * 1 + y * 0 + z * 0 + 1 * 0, 
   x * 0 + y * 1 + z * 0 + 1 * 0,
   x * 0 + y * 0 + z * a + 1 * b,
   x * 0 + y * 0 + z *-1 + 1 * 0]

= [x + 0 + 0 + 0,
   0 + y + 0 + 0,
   0 + 0 + az + b,
   0 + 0 + -z + 0]

= [x y az + b, -z]
Note:
1. -z
- since z is a negative number (its pointing at us), - makes it positve
- what are we going to do with -z ? We are going to divide it eventually
- dividing is a trick that achieves the illusion of perspective
- why divide = well if z is small means 1 / zSmall - things are NEAR
- when z is big, 1 / zBig ~ small number - things are FAR
2. az + b (algebra)
- what does az + b mean exactly.

a = ((f + n) / (f - n))
b = 2fn / (f - n)

with substitution, the matrix V becomes

[1 0 0                    0
 0 1 0                    0
 0 0 ((f + n) / (f - n)) -1
 0 0 (2fn / (f - n))      0]

where
f = far, n = near
code
// 
const nf = 1 / (near - far);
out[10] = (far + near) * nf;
out[14] = 2 * far * near * nf;

Calculation: a
-an + b = n
-af + b = -f
============
=> -an - (-af) + b - b = n + f
=> af - an = n + f
=  a*(f - n) = n + f
= a = (f + n) / (f - n)

// b
-an + b = n: next we need to substitute a with the result above

-n * ((f + n) / (f - n)) + b = n
b = n + n * ((f + n) / (f - n))
b = n * (1 + ((f + n) / (f - n)))

b = n * ((f - n + f + n) / (f - n))
b = n * (2f / (f - n))

b = 2fn / (f - n)

QED
// ====
So what does a and b exactly do?

[1 0 0                    0
 0 1 0                    0
 0 0 ((f + n) / (f - n)) -1
 0 0 2fn / (f - n)        0]

 So when n increases, it squishes things down. Also it makes sure that it gets squished to
 -1 and 1
 The problem is that we have taken the considersation into where the x and y goes,
 we have just dealt with z here
 - Note: dont set far and near to the same value
 - Identity matrix is like place holders. Currently we have 1 as place holder for value of
   x and y.
 - Lets fix that

 Clipping Space Y:,

 Lets talk about the clip space: what will its cordinates
 => We know that x = 0, z = -n, what about y?
 If n is adjacent, and opposite is d, we know that
 NOTE: alpha is field of view (angle)
 d / n = tan(alpha / 2)

 d = n * tan (alpha / 2)

 So the point becomes: [0, n * tan (alpha / 2), -n]

 Now if we multiply
 [0, n * tan (alpha / 2), -n 1] (1 x 4) with V (4 x 4)


 =>  [0, n * tan (alpha / 2), -n 1] * V
 => [0, n * tan(alpha / 2), ((f + n) / (f - n)) * -n + 2fn (f - n),  -n]
 we will get 1 x 4 matrix back:

 to convert to 3D, we need to add depth, and the best way is by dividing by n,
 => [0/ n,  n * tan (alpha / 2) / n ...]

 so value of y = tan(alpha / 2).... but wait

 this value is top left side of the screen: and it must be (0, 1, 1)
 but the value above aint 1, so we have to normalize it
 so.... so it has to be cotangent

 but we know that
 cotan(alpha / 2) = 1 / tan(alpha / 2)
 y = 1 / tan(alpha / 2)

 Note: cotangent + tangent = 1

 x has to be same as well since both x and y are equal to 1

 so with that in place our matrix becomes

 [ctan(alpha / 2)  0                0                    0
  0                ctan(alpha / 2)  0                    0
  0                0                ((f + n) / (f - n)) -1
  0                0                2fn / (f - n)        0]


This is called the viewing matrix
So we have a 4 x 4 matrix that takes the pyramid and converts it into an image perspective ...
ONCE I divide by w, it actually does the squishing of the pyramid into these nicely parallel planes

There is a famous paper written by three of the gods of computer graphics
Ivan Sutherland who started the field of comp graphics in 1963
  - He had to build his own equipment and program it!
Paper: A Characterization of Ten Hidden-Surface Algorithms

They come to conclusion that there are 5 basic types of algorithms,
2 of them works, ALL three of them got wrong
- Depth Buffering
- Ray Tracing

1. Painters Algorithm (gaming) - gets used all the time

How did the three GODS of computer graphics
The reason they were wrong is that in 1976, when they wrote the paper
the machines of that time had 32K of address space and 32K for data programming

- aka you could store only 32K

Everything else was offline on disk

Compared to today where we have gigabyes of RAM that we can get access to, things were a little harder back in the day. Now we take it for grand and have forgotten how to compute.

This was not the only thing they missed,

the other thing that they completely is Moores Law
- Moores Law basically says that things are going to become faster - which enabled Ray Tracing


When ray tracing first came out in 1980s, it would take maybe 5-6 hours to make couple of simple pictures. Some of the biggest machines we had. Now you can do 5 times a SECOND on a fairly COMPLEX system


The difference was in the SPEED and SIZE of the machines














 `;
