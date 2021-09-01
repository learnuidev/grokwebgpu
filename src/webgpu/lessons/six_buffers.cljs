(ns webgpu.lessons.six-buffers
  (:require ["/lessons/06_buffers.js" :as buffers :refer [makeGlobal createSquare]]
            [cljs.repl :refer [doc]]))

(comment
  "Make everything for interactive learning experience")
(makeGlobal buffers)

  ; const vertexData =
  ;   flatten(vertData) ||
  ;   flatten([])
  ;     [-0.5, -0.5], // vertex a
  ;     [0.5, -0.5], // vertex b
  ;     [-0.5, 0.5], // vertex d
  ;     [-0.5, 0.5], // vertex d
  ;     [0.5, -0.5], // vertex b
  ;     [0.5, 0.5] // vertex c
  ;   ;
  ;
  ; const colorData =
  ;   flatten(color) ||
  ;   flatten([])
  ;     [1, 0, 0], // vertex a: red
  ;     [0, 1, 0], // vertex b: green
  ;     [1, 1, 0], // vertex d: yellow
  ;     [1, 1, 0], // vertex d: yellow
  ;     [0, 1, 0], // vertex b: green
  ;     [0, 0, 1] // vertex c: blue)
    ;
(comment "API")
(def primitive-types
  #{:point-list
    :line-list
    :line-strip
    :triangle-list
    :triangle-strip})

(def vert-a [[-0.7, -0.5] ;; vertex a
             [0.5, -0.5]  ;; vertex b
             [-0.5, 0.5]  ;; vertex d

             [-0.5, 0.5]  ;; vertex d
             [0.5, -0.5]  ;; vertex b
             [0.7, 0.5]]) ;; vertex c
(defn create-square
  "Create a square"
  [{:keys [canvas]}]
  (createSquare (clj->js {:canvas canvas
                          :draw 6
                          :primitiveType :triangle-list
                          :background [0.1 0.5 1 1]
                          :vertData [[-0.5 -0.5]    ;; vertex a
                                     [0.5 -0.5]     ;; vertex b
                                     [-0.5  0.5]    ;; vertex d
                                     [-0.5  0.5]    ;; vertex d
                                     [0.5 -0.5]     ;; vertex b
                                     [0.5   0.5]]   ;; vertex c
                          :color [[1 0 0]      ;; vertex a: red
                                  [0 1 0]      ;; vertex b: green
                                  [1 1 0]      ;; vertex d: yellow
                                  [1 1 0]      ;; vertex d: yellow
                                  [0 1 0]      ;; vertex b: green
                                  [0 0 1]]}))) ;; vertex c: blue]})))

(comment
  (doc create-square))
(defn app []
  (let [canvas (js/document.getElementById "app")]
    (create-square {:canvas canvas})))
