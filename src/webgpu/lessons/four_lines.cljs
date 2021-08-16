(ns webgpu.lessons.four-lines
  (:require ["/drxu/04_lines.js" :default line]))

;; Define interface
(defn shaders [color]
  (.Shaders line color))
;
(defn create-primitive [{:keys [canvas primitive-type vert frag]}]
  (.CreatePrimitive line (clj->js {:canvas canvas
                                   :primitiveType primitive-type
                                   :vert vert
                                   :frag frag})))
;
; ;; testing time
(comment
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "point-list"})
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "line-list"})
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "line-strip"})

  (shaders "(0,0,0,1"))

;; app
(defn app []
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "point-list"
                     :vert
                     "[[stage(vertex)]]
                     fn main([[builtin(vertex_index)]] VertexIndex: u32) -> [[builtin(position)]] vec4<f32> {
                         var pos = array<vec2<f32>, 8>(
                             vec2<f32>(-0.6,  0.7),
                             vec2<f32>(-0.7,  0.7),
                             vec2<f32>(-0.8,  0.7),
                             vec2<f32>( 0.3,  0.6),
                             vec2<f32>( 0.5,  0.3),
                             vec2<f32>( 0.4, -0.5),
                             vec2<f32>(-0.4, -0.4),
                             vec2<f32>(-0.3,  0.2)
                         );
                         return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
                     }"
                     :frag
                     "
                     [[stage(fragment)]]
                     fn main() ->  [[location(0)]] vec4<f32> {
                         return vec4<f32>(1.0, 1.0, 0.0, 1.0);
                     }
                     "}))

(comment
  (create-primitive))
