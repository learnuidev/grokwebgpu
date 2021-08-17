(ns webgpu.lessons.five-triangle
  (:require ["/lessons/05_triangle_primitive.js" :as triangle]))

(comment
  (js/console.log triangle))
;; Define interface
(defn shaders [color]
  (.Shaders triangle))

(defn create-primitive [{:keys [canvas primitive-type vert frag]}]
  (.CreatePrimitive triangle (clj->js {:canvas canvas
                                       :primitiveType primitive-type
                                       :vert vert
                                       :frag frag})))
;
; ;; Primitives === testing time
(comment
  "Date: 3:00PM Monday, 16th August 2021"
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "point-list"})
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "line-list"})
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "line-strip"})
  "Date: 3:20PM Monday, 16th August 2021"
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "triangle-list"})
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "triangle-strip"})
  (shaders "(0,0,0,1"))

;; app
(defn app []
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "triangle-strip"
                     :vert
                     "
                     struct VertOutput {
                         [[builtin(position)]] Position : vec4<f32>;
                         [[location(0)]] vColor : vec4<f32>;
                     };
                     [[stage(vertex)]]
                     fn main([[builtin(vertex_index)]] VertexIndex: u32) -> VertOutput {
                         var pos : array<vec2<f32>, 9> = array<vec2<f32>, 9>(
                             vec2<f32>(-0.62,  0.80),
                             vec2<f32>(-0.87,  -0.6),
                             vec2<f32>(-0.20,  0.60),
                             vec2<f32>(-0.37, -0.07),
                             vec2<f32>( 0.05,  0.18),
                             vec2<f32>(-0.13, -0.40),
                             vec2<f32>( 0.30, -0.13),
                             vec2<f32>( 0.13, -0.64),
                             vec2<f32>( 0.70, -0.30)
                         );

                         var color : array<vec3<f32>, 9> = array<vec3<f32>, 9>(
                             vec3<f32>(0.0, 0.0, 1.0),
                             vec3<f32>(0.0, 1.0, 1.0),
                             vec3<f32>(1.0, 0.0, 1.0),
                             vec3<f32>(0.0, 0.4, 0.5),
                             vec3<f32>(0.0, 1.0, 1.0),
                             vec3<f32>(0.5, 1.0, 1.0),
                             vec3<f32>(0.5, 0.2, 0.8),
                             vec3<f32>(0.0, 1.0, 1.0),
                             vec3<f32>(0.0, 0.0, 1.0)
                         );
                         var output: VertOutput;
                         output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
                         output.vColor = vec4<f32>(color[VertexIndex], 1.0);
                         return output;
                     }"
                     :frag
                     "
                     [[stage(fragment)]]
                     fn main([[location(0)]] vColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
                         // return vec4<f32>(0.4, 0.4, 0.8, 1.0);
                         return vColor;

                     }
                     "}))

(comment
  (create-primitive))
