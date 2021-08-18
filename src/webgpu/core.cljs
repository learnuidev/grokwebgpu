(ns webgpu.core
  (:require
   #_[webgpu.lessons.one-triangle :refer [app]]
   #_[webgpu.lessons.two-triangle :refer [app]]
   ;; TODO:: lesson 03
   #_["@webgpu/glslang/dist/web-devel-onefile/glslang.js" :as glslang]
   #_[webgpu.lessons.four-lines :refer [app]]
   #_[webgpu.lessons.five-triangle :refer [app]]
   [webgpu.lessons.six-buffers :refer [app]]
   [webgpu.lessons.seven-buffer-triangles :as buffer-triangle]
   [webgpu.lessons.eight-buffer-one-triangle :as buffer-one-triangle]))

(defn ^:dev/after-load start []
  (buffer-one-triangle/app))

(defn ^:export init []
  (start))
