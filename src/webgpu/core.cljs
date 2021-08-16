(ns webgpu.core
  (:require
   #_[webgpu.lessons.one-triangle :refer [app]]
   #_[webgpu.lessons.two-triangle :refer [app]]
   ;; TODO:: lesson 03
   #_["@webgpu/glslang/dist/web-devel-onefile/glslang.js" :as glslang]
   [webgpu.lessons.four-lines :refer [app]]))

(defn ^:dev/after-load start []
  (app))

(defn ^:export init []
  (start))
