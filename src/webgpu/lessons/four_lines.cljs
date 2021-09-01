(ns webgpu.lessons.four-lines
  (:require ["/lessons/04_lines.js" :default line]))

;; Define interface
(defn shaders [color]
  (.createShaders line color))
;
(defn create-primitive [{:keys [canvas primitive-type vert frag draw]}]
  (.createPrimitive line (clj->js {:canvas canvas
                                   :primitiveType primitive-type
                                   :vert vert
                                   :draw draw
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
                     :draw 9
                     :vert
                     "
                     struct Instance {
                         pos: vec2<f32>;
                         radius: f32;
                         color: vec4<f32>;
                     };

                     [[stage(vertex)]]
                     fn main([[builtin(vertex_index)]] VertexIndex: u32) -> [[builtin(position)]] vec4<f32> {
                         var pos = array<vec2<f32>, 10>(
                             vec2<f32>(-0.6,  0.7),
                             vec2<f32>(-0.5,  0.7),
                             vec2<f32>(-0.4,  0.7),
                             vec2<f32>(-0.7,  0.7),
                             vec2<f32>(-0.8,  0.7),
                             vec2<f32>( 0.3,  0.6),
                             vec2<f32>( 0.5,  0.3),
                             vec2<f32>( 0.4, -0.5),
                             vec2<f32>(-0.4, -0.4),
                             vec2<f32>(-0.3,  0.2)
                         );

                         // Explosion Effect ===
                         var input: Instance;
                         input.radius = 0.42;
                         input.pos = vec2<f32>(0.6, -0.2);

                         let vpos = input.pos + pos[VertexIndex] * input.radius;
                         return vec4<f32>(vpos, 0.0, 1.0);
                     }"
                     :frag
                     "
                     [[stage(fragment)]]
                     fn main() ->  [[location(0)]] vec4<f32> {
                         return vec4<f32>(0.2, 1.0, 1.0, 1.0);
                     }
                     "}))

(comment
  (create-primitive))
