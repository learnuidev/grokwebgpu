(ns webgpu.lessons.ten-projection
  (:require ["gl-matrix" :refer [vec4 mat4]]))

"Lesson 1"
(defn look-at [m cam-pos dir up-dir]
  (.lookAt mat4 m (clj->js cam-pos) (clj->js dir) (clj->js up-dir)))

(defn create-view-matrix [cpos dir udir]
  (look-at (.create mat4) cpos dir udir))

(def view-mat (create-view-matrix  [3, 4, 5] [-3, -4, -5]  [0, 1, 0]))
"Float32Array
  [ 0.8574929237365723    -0.2910427451133728    0.4242640733718872 0
    0                      0.8246211409568787    0.5656854510307312 0
   -0.5144957304000854    -0.48507124185562134   0.7071067690849304 0
    4.440892098500626e-16  0                    -7.071067810058594  1]"

"Lesson 2"
(defn create-fustrum [{:keys [left right bottom top near far]}]
  (.frustum mat4 (.create mat4) left, right, bottom, top, near, far));


(comment
  (create-fustrum {:left -3
                   :right 3
                   :bottom -5
                   :top 5
                   :near -1
                   :far -100}))
"Float32Array
 [-0.3333333432674408  0                    0                   0
   0                  -0.20000000298023224  0                   0
   0                   0                   -1.0202020406723022 -1
   0                   0                    2.0202019214630127  0]"

;;
"Lesson 3: Create Perspective Camera"

(defn create-perspective [{:keys [fovy aspect near far]}]
  (.perspective mat4 (.create mat4) fovy  aspect  near far));

(comment
  (create-perspective {:fovy (/ js/Math.PI 6)
                       :aspect 1.5
                       :near -1
                       :far -100}))
"#object [Float32Array
  2.4880337715148926 0 0 0
  0 3.732050895690918 0 0
  0 0 -1.0202020406723022 -1
  0 0 2.0202019214630127 0]"

"Lesson 4: Create Ortho:"
(defn create-ortho [{:keys [right left bottom top near far]}]
  (.ortho mat4 (.create mat4), left, right, bottom, top, near, far))
(comment
  (create-ortho {:right 3 :left   -3
                 :top   5 :bottom -5
                 :near -1 :far    -100}))
"#object [Float32Array
  0.3333333432674408 0 0 0
  0 0.20000000298023224 0 0
  0 0 0.020202020183205605 0
  0 0 -1.0202020406723022 1]"

(defn app []
  (js/console.log "projection"))
