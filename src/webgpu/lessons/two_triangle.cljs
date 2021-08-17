(ns webgpu.lessons.two-triangle
  (:require ["/lessons/02_triangle_colored.js" :as triangle]))

;; Define interface
(defn shaders [color]
  (.Shaders triangle color))

(defn create-triangle [{:keys [canvas color vert frag]}]
  (.CreateTriangle triangle (clj->js {:canvas canvas
                                      :color color
                                      :vert vert
                                      :frag frag})))

;; testing time
(comment
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color "(1.0,1.0,1.0,1.0)"})
  (shaders "(0,0,0,1"))

;; app
(defn app []
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color "(1.0,1.0,1.0,1.0)"
                    :vert
                    "struct Output {
                        [[builtin(position)]] Position : vec4<f32>;
                        [[location(0)]] vColor : vec4<f32>;
                     };

                     [[stage(vertex)]]
                     fn main([[builtin(vertex_index)]] VertexIndex: u32) -> Output {
                         var pos = array<vec2<f32>, 3>(
                             vec2<f32>(0.0, 0.5),
                             vec2<f32>(-0.5, -0.5),
                             vec2<f32>(0.5, -0.5)
                         );

                         var color = array<vec3<f32>, 3>(
                             vec3<f32>(1.0, 0.0, 0.0),
                             vec3<f32>(0.0, 1.0, 0.0),
                             vec3<f32>(0.0, 0.0, 1.0)
                         );
                         var output: Output;
                         output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
                         output.vColor = vec4<f32>(color[VertexIndex], 1.0);
                         return output;
                      }"
                    :frag
                    "[[stage(fragment)]]
                     fn main([[location(0)]] vColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
                        return vColor;
                        // return vec4<f32>(0.0, 1.0, 1.0, 1.0);
                     }"}))
