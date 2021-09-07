(ns webgpu.core
  (:require
   ;; Lesson: Basics
   [webgpu.lessons.basics.one-triangle :as one]
   [webgpu.lessons.basics.two-triangle :as two]
   [webgpu.lessons.basics.four-lines :as four]
   [webgpu.lessons.basics.five-triangle :as five]
   ;; Lesson:  Buffers
   [webgpu.lessons.buffers.six-buffers :as six]
   [webgpu.lessons.buffers.seven-buffer-triangles :as seven]
   [webgpu.lessons.buffers.eight-buffer-one-triangle :as eight]
   ;; Lesson: Camera
   [webgpu.lessons.camera.nine-transformation :as nine]
   [webgpu.lessons.camera.ten-projection :as ten]
   ;; Chapter 6
   [webgpu.lessons.ch06.cube-vertex-colors :as eleven]
   [webgpu.lessons.ch06.line :as twelve]
   ;; 3D
   [webgpu.lessons.threed.basic-scene-renderer :as bsr]
   ;; Computing Examples
   [webgpu.lessons.compute.twelve-blur :as cone]))
   ;; Book
   ; [webgpu.book.one :as one]))

(def lessons
  {:basics {:one one/app
            :two two/app
            :three four/app
            :four five/app}
   :buffers {:one six/app
             :two seven/app
             :three eight/app}
   :camera {:one nine/app
            :two ten/app}
   :ch06 {:one eleven/app
          :two twelve/app}
   ;; 3d
   :3d {:one bsr/app}
   ;; Compute
   :compute {:one cone/app}})

;; Lessons options
(def opts
  #{:basics
    :buffers
    :camera
    :ch06 :3d
    :compute})

(comment
  (opts :bassics))
(defn app
  ([id] (app id :basics))
  ([id option]
   (if (opts option)
     ((-> lessons option id))
     (println (str "Should be one of the following: " opts)))))

(comment
  (app :one)
  (app :two)
  (app :four))

(defn ^:dev/after-load start []
  (app :one :compute))

(defn ^:export init []
  (start))
