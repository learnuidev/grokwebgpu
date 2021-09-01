(ns webgpu.lessons.two-triangle
  (:require ["/lessons/02_triangle_colored.js" :as triangle]))

;; Define interface
(defn shaders [color]
  (.Shaders triangle color))

(defn create-triangle [{:keys [canvas color vert frag graphics]}]
  (.CreateTriangle triangle (clj->js {:canvas canvas
                                      :color color
                                      :vert vert
                                      :frag frag
                                      :graphics graphics})))

;; testing time
(comment
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color "(1.0,1.0,1.0,1.0)"})
  (shaders "(0,0,0,1"))

;; app
(comment "List of all the available WGSL attributes: (13)
  - align
  - binding
  - block
  - builtin
  - group
  - interpolate
  - invariant
  - location
  - override
  - size
  - stage
  - stride
  - workgroup_size
 Source: https://www.w3.org/TR/WGSL/#attribute-align")
(comment "Notes: Built-in Inputs and Outputs - https://www.w3.org/TR/WGSL/#builtin-inputs-outputs
  - A built-in input variable provides access to system-generated control information. The set of built-in inputs are listed in § 15 Built-in variables.

  To declare a variable for accessing a particular input built-in X from an entry point:
  - Declare a parameter of the entry point function, where the store type is the listed store type for X.
  - Apply a builtin(X) attribute to the parameter.

  A built-in output variable is used by the shader to convey control information to
  later processing steps in the pipeline. The set of built-in outputs are listed in § 15 Built-in variables.

  To declare a variable for accessing a particular output built-in Y from an entry point:

  - Add a variable to the result of the entry point, where store type is the listed store type for Y:
  - If there is no result type for the entry point, change it to the variable type.
  - Otherwise, make the result type to be a structure, where one of the fields is the new variable.
  - Apply a builtin(Y) attribute to the result variable.

  Both input and output built-in variables may also be declared as members of
  structures that are either entry point function parameters (for inputs) or the
  return type of an entry point (for outputs). The type of the structure member
  must match the type specified for the built-in variable.

  The builtin attribute must not be applied to a variables in module scope, or the
  local variables in the function scope.

  A variable must not have more than one builtin attribute.

  Each built-in variable has an associated shader stage, as described in § 15 Built-in variables.
  If a built-in variable has stage S and is used by a function F, as either an argument
  or the result type, then F must be a function in a shader for stage S.
 ")

(comment "List of builtin variables: (13)
  - vertex_index
    - Index of the current vertex within the current API-level draw command,
      independent of draw instancing.
    - For a non-indexed draw, the first vertex has an index equal to the firstVertex
      argument of the draw, whether provided directly or indirectly. The index
      is incremented by one for each additional vertex in the draw instance.
    - For an indexed draw, the index is equal to the index buffer entry for vertex,
      plus the baseVertex argument of the draw, whether provided directly or
      indirectly.
  - instance_index
  - position (vertex)
  - position (fragment)
  - front_facing
  - frag_depth
  - local_invocation_id
  - local_invocation_index
  - global_invocation_id
  - workgroup_id
  - num_workgroups
  - sample_index
  - sample_mask (in fragment)
  - sample_mask (out framgnet)
  source: https://www.w3.org/TR/WGSL/#builtin-variables")
(defn app []
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color "(1.0,1.0,1.0,1.0)"
                    :vertex {:entry :vert_main}
                    ; :frag {:entry :frag_main}
                    :vert
                    "struct Output {
                         [[builtin(position)]] pos: vec4<f32>;
                         [[location(0)]]     color: vec4<f32>;
                     };

                     [[stage(vertex)]]
                     // u32: The 32-bit unsigned integer type.
                     fn main([[builtin(vertex_index)]] vertIdx: u32) -> Output {
                         var pos = array<vec2<f32>, 3>(
                             vec2<f32>(0.0, 0.5),
                             vec2<f32>(-0.5, -0.5),
                             vec2<f32>(0.5, -0.5)
                         );

                         var color = array<vec3<f32>, 3>(
                             vec3<f32>(1.0, 0.0, 0.0),
                             vec3<f32>(0.0, 1.0, 1.0),
                             vec3<f32>(0.0, 0.0, 1.0)
                         );
                         var output: Output;
                         output.pos = vec4<f32>(pos[vertIdx], 0.0, 1.0);
                         output.color = vec4<f32>(color[vertIdx], 1.0);
                         return output;
                      }"
                    :frag
                    "[[stage(fragment)]]
                     fn main([[location(0)]] color: vec4<f32>) -> [[location(0)]] vec4<f32> {
                        return color;
                        // return vec4<f32>(0.0, 1.0, 1.0, 1.0);
                     }"}))

(defn app-old []
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color "(1.0,1.0,1.0,1.0)"}))
