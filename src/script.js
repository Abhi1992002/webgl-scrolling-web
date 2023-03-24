import * as THREE from 'three'
import * as dat from 'lil-gui'
import gsap from 'gsap'

/**
 * Debug
 */
const gui = new dat.GUI()

const parameters = {
    materialColor: '#ffeded'
}


gui
    .addColor(parameters, 'materialColor')
    .onChange(()=>{
        material.color.set(parameters.materialColor)
        particcleMaterial.color.set(parameters.materialColor)
    })

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Objects
 */

//textures
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load("textures/gradients/3.jpg")
gradientTexture.magFilter = THREE.NearestFilter // no mixes of color => give cartoonist effect

const material = new THREE.MeshToonMaterial({
    color:parameters.materialColor,
    gradientMap:gradientTexture
})

const objectDistance = 4;

const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1,0.414,60),
    material
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1,2,32),
    material
)
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8,0.35,100,16),
   material
   )

mesh1.position.y = -objectDistance * 0
mesh2.position.y = -objectDistance * 1
mesh3.position.y = -objectDistance * 2

mesh1.position.x = 2
mesh2.position.x = -2
mesh3.position.x = 2

scene.add(mesh1 , mesh2 , mesh3)

const sectionMeshes = [mesh1, mesh2, mesh3]

//addingg particles to add more depth
const particleCount = 200
const position = new Float32Array(particleCount*3)


for (let i = 0; i < particleCount; i++) {
   
    let i3 = i * 3;

    position[i3] = (Math.random()-0.5)*10
    position[i3+1] = objectDistance*0.5 - Math.random()* objectDistance *3 //mutiply by 3 because of 3 vh , y=0 is center so to move particles above center we minus objectDistance*0.5
    position[i3+2] = (Math.random()-0.5)*10

    
}
const particle = new THREE.BufferGeometry()

particle.setAttribute('position' ,new THREE.BufferAttribute(position,3))

//material 

const particcleMaterial = new THREE.PointsMaterial({
    color:parameters.materialColor,
    sizeAttenuation:true,
    size:0.03
})

const points = new THREE.Points(particle, particcleMaterial)

scene.add(points)

//Light
const directionalLight = new THREE.DirectionalLight("#fff",1)
directionalLight.position.set(1,1,0)
scene.add(directionalLight)
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

//camera gruop

const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha:true // make background transparent
})
// renderer.setClearAlpha(0.5) => by default 0
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//scroll section
let scrollY = window.scrollY
//triggering animation when reach to a particular point
let currentSection = 0


window.addEventListener('scroll',()=>{
    scrollY =  window.scrollY

    const newSection = Math.round(scrollY / sizes.height)

    if(newSection !== currentSection){
       currentSection = newSection
       
       gsap.to(sectionMeshes[currentSection].rotation,{
             duration:1.5,
             ease:'power2.inOut',
             // object is currently rotating , we add more speed
             x:`+=6`,
             y:`+=3`,
             z:`+=1.5`
       })

    }

})


//Adding parallax effect => what we do is that we move our camera with mouse

//cursor
const cursor = {
    x : 0,
    y: 0
}

window.addEventListener('mousemove',(e)=>{
    cursor.x = e.clientX / sizes.width - 0.5
    cursor.y = e.clientY / sizes.height - 0.5

})

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    //animate camera 
    // we have 2 issue one is camera is very sensitive nad going in wrong direction
    //sensitive because if we move 1000px , camera goes 1000unit
    // distannce betweeen object => 4 , 
     

    camera.position.y = - (scrollY / sizes.height) * objectDistance

    //now when we scroll down , only one shape is seeing not all so to fix this we put camera inside a group
    //to make parallax more realistic we add easing , instead of movng camera straight to target , we are goint to move it a 10th closer to the destination

    const parallaxX = cursor.x
    const parallaxY = - cursor.y

    //here i am moving camera in 0.02 (2*deltaTime ~ 0.02) of its destination in one frame , 60 framee in a sec , 0.02*50 = 1 , in 50 frames he reches his destination , means in less than 1 sec
    cameraGroup.position.x += (parallaxX-cameraGroup.position.x) * 2 * deltaTime
    cameraGroup.position.y += (parallaxY-cameraGroup.position.y)  * 2 * deltaTime



    //animate meshes
    for (const mesh of sectionMeshes){
        mesh.rotation.x += deltaTime * 0.1
        mesh.rotation.y += deltaTime * 0.1
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()