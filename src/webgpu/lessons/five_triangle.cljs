(ns webgpu.lessons.five-triangle
  (:require ["/lessons/05_triangle_primitive.js" :as triangle]))

(comment
  (js/console.log triangle))
;; Define interface
(defn shaders [color]
  (.Shaders triangle))

(defn create-primitive [{:keys [canvas primitive-type vert frag draw background]}]
  (.CreatePrimitive triangle (clj->js {:canvas canvas
                                       :background background
                                       :primitiveType primitive-type
                                       :vert vert
                                       :draw draw
                                       :frag frag})))
;
; ;; Primitives === testing time
(def primitive-types
  #{:point-list
    :line-list
    :line-strip
    :triangle-list
    :triangle-strip})

(comment
  "Date: 3:00PM Monday, 16th August 2021"
 ;; Point (1) - :point-list
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type :point-list
                     :draw 10})
 ;; Line
 ;; (2) - #{:line-list, :line-strip}
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type :line-list
                     :draw 12})
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type :line-strip
                     :draw 12
                     :background [0.6 0.6 1.0 1.0]})
;; Triangle
;; (2) - #{:triangle-list, :triangle-strip}
  "Date: 3:20PM Monday, 16th August 2021"
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type :triangle-list
                     :draw [12 1 0 0]})
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type :triangle-strip
                     :draw [12 1 0 0]}))

;;
(comment
  (shaders "(0,0,0,1"))

;; app
(comment
  (.-width (js/document.getElementById "app")))

(defn app []
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type :line-strip
                     :background [0.3 0.2 0.3 1.0]
                     ; :background {:r 1.0 :g 0.2 :b 0.3 :a 1.0}
                     :draw [12 1 0 0]
                     :vert
                     "
                     struct VertexOutput {
                         [[builtin(position)]] Position : vec4<f32>;
                         [[location(0)]] vColor : vec4<f32>;
                     };

                     [[stage(vertex)]]
                     fn main([[builtin(vertex_index)]] VertexIndex: u32) -> VertexOutput {
                         var pos: array<vec2<f32>, 12> = array<vec2<f32>, 12>(
                             vec2<f32>(-0.62,  0.80),
                             vec2<f32>(-0.87,  -0.6),
                             vec2<f32>(-0.20,  0.60),
                             vec2<f32>(-0.37, -0.07),
                             vec2<f32>( 0.05,  0.18),
                             vec2<f32>(-0.13, -0.40),
                             vec2<f32>( 0.30, -0.13),
                             vec2<f32>( 0.13, -0.64),
                             vec2<f32>( 0.70, -0.30),
                             vec2<f32>(0.0, -0.30),
                             vec2<f32>(0.0, -0.60),
                             vec2<f32>(0.0, -0.90),
                         );

                         // specifying types for array is optional
                         var color = array<vec3<f32>, 12>(
                             vec3<f32>(1.0, 1.0, 1.0),
                             vec3<f32>(1.0, 1.0, 1.0),
                             vec3<f32>(1.0, 0.4, 0.3),
                             vec3<f32>(1.0, 0.1, 0.0),
                             vec3<f32>(1.0, 0.9, 0.4),
                             vec3<f32>(0.4, 0.5, 0.7),
                             vec3<f32>(1.0, 0.2, 0.8),
                             vec3<f32>(1.0, 1.3, 0.0),
                             vec3<f32>(1.0, 0.0, 1.0),
                             vec3<f32>(1.0, 0.0, 1.0),
                             vec3<f32>(1.0, 0.0, 1.0),
                             vec3<f32>(1.0, 0.0, 1.0)
                         );
                         var output: VertexOutput;
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
