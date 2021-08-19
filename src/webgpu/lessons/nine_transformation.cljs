(ns webgpu.lessons.nine-transformation
  (:require ["gl-matrix" :refer [vec4 mat4]]))

(comment "Matrix Helpers")

(defn transform-mat4 [v2 mv mm]
  (.transformMat4 vec4 v2 mv mm))
(comment "Lesson: 3D Transformations
          Date: 08/18/2021")

(defn vec4->from-values [& args]
  (apply (.-fromValues vec4) args))

(defn mat4->from-scaling [m v]
  (.fromScaling mat4 m (clj->js v)))
(comment
  (from-values 1 2 3 1))
(comment)

(comment
  "Example 1.1: Scaling =========
   To scale or stretch an object in the x direction, you need to multiply the x
   coordinates of each of the object’s points by the scaling factor, 𝑠𝑥.
   Similarly, you can scale an object in the y and z directions.
   In the standard 3D Cartesian coordinate system, a scaling transformation
   can be represented in the form:
  ")
"1.1 we first create the original vector (1, 2, 3, 1), using fromValues method"
(def my-vec (vec4->from-values 1, 2, 3, 1))
"#object [Float32Array 1 2 3 1]"

"1.2 create the scaling matrix by calling the mat4.fromScaling method"
(def my-mat (mat4->from-scaling (.create mat4) [0.5, 0.5, 1.5]))
"#object [Float32Array 0.5 0   0   0
                       0   0.5 0   0
                       0   0   1.5 0
                       0   0   0   1]"

"1.3. Finally, we scale the vector by calling the vec4.transformMat4
      function. This function accepts three arguments
        - vector-input
        - original vector
        - scaling matrix"
(def scaled-vec (transform-mat4 (.create vec4) my-vec my-mat));
"#object [Float32Array 0.5 1 4.5 1]"

"Ex 1.2: Scaling ========"
"2.1 two successive scaling transforms:
 2.2 get total scaling matrix after another scaling transformation:"
(def scaled-mat (.scale mat4 (.create mat4), my-mat (clj->js [1, 0.5, 0.3])));))
"#object [Float32Array 0.5 0     0                   0
                       0   0.25  0                   0
                       0   0     0.44999998807907104 0
                       0   0     0                   1]"

"get final scaled vector:"
(comment
  (transform-mat4 scaled-vec my-vec scaled-mat));
"#object [Float32Array 0.5 0.5 1.3499999046325684 1]"

"===================="
"Ex 2: Translation"

"2.1: Create a vector"
(def my-vec2 (vec4->from-values 1, 2, 3, 1))
"=> [Float32Array 1 2 3 1]"

"2.2.1: Create translation matrix"
(def my-mat2 (.fromTranslation mat4 (.create mat4) (clj->js [2 2.5 3])))
" => [Float32Array 1 0   0 0
                   0 1   0 0
                   0 0   1 0
                   2 2.5 3 1]"
"2.2.2: get total translation matrix after another translation:"
(def trans-mat (.translate mat4 (.create mat4) my-mat2 (clj->js [-3 -2 -1])))
"=> [Float32Array  0.5  0.0  0.0 0
                   0.0  0.5  0.0 0
                   0.0  0.0  1.5 0
                  -1.5 -1.0 -1.5 1]"

"Step 2.3: get final translated vector:"
(def trans-vec (transform-mat4 (.create vec4) my-vec2 trans-mat));)
"=> [Float32Array 0 2.5 5 1]"

"===================="
"Example 3: Rotation"

"3.1: Create a vector"
(def my-vec3 (vec4->from-values 1, 2, 3, 1))
"#object [Float32Array 1 2 3 1]"

"3.2: create a rotation matrix around the z axis by 20 degrees:"
(def rot-matz (.fromZRotation mat4 (.create mat4) (* 20 (/ js/Math.PI 180))));
"#object [Float32Array  0.9396926164627075 0.3420201539993286 0 0
                       -0.3420201539993286 0.9396926164627075 0 0
                        0                  0                  1 0
                        0                  0                  0 1]"

"3.3: get the total rotation matrix after another rotation around the z axis by 25 degrees:"
(def rot-mat (.rotateZ mat4 (.create mat4), rot-matz (* 25 (/ js/Math.PI 180))));
"#object [Float32Array  0.7071067690849304 0.7071067690849304 0 0
                       -0.7071067690849304 0.7071067690849304 0 0
                        0                  0                  1 0
                        0                  0                  0 1]"
"3.4: get final rotated vector:"
(def rot-vec (transform-mat4 (.create vec4), my-vec3, rot-mat));
"#object [Float32Array -0.7071067690849304 2.1213202476501465 3 1]"

(defn app []
  (js/console.log "APP"))
