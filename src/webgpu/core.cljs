(ns webgpu.core
  (:require
   ; [webgpu.lessons.one-triangle :as one]
   ; [webgpu.lessons.two-triangle :as two]
   ; ;; TODO:: lesson 03
   ; #_["@webgpu/glslang/dist/web-devel-onefile/glslang.js" :as glslang]
   ; [webgpu.lessons.four-lines :as four]
   ; [webgpu.lessons.five-triangle :as five]
   ; [webgpu.lessons.six-buffers :as six]
   ; [webgpu.lessons.seven-buffer-triangles :as seven]
   ; [webgpu.lessons.eight-buffer-one-triangle :as eight]
   ; [webgpu.lessons.nine-transformation :as nine]
   ; [webgpu.lessons.ten-projection :as ten]
  ;;  [webgpu.lessons.ch06.cube-vertex-colors :as eleven]
  ;;  [webgpu.lessons.genka.basic-scene-renderer :as bsr]
   ;; Computing Examples
   ; [webgpu.compute.one :as compute]
   ; [webgpu.lessons.twelve-texture :as texture]
   ;; Book
   [webgpu.book.one :as one]))

(defn ^:dev/after-load start []
  (one/app))

(defn ^:export init []
  (start))
