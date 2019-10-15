import 'babel-polyfill'
import dragDrop from 'drag-drop'

const config = {
  margin: 16,
  scale: 0.5,
}

const main = () => {
  setupDragDrop()
}

const setupDragDrop = () => {
  dragDrop('.js-dropzone', {
    async onDrop (files, pos, fileList, directories) {
      updateConfig()
      const results = await readFileList(files)
      createImage(results)
    },
  })
}

const updateConfig = () => {
  const $margin = document.querySelector('.js-margin')
  config.margin = parseInt($margin.value, 10) || config.margin
  const $scale = document.querySelector('.js-scale')
  config.scale = parseFloat($scale.value) || config.scale
}

const readFileList = async files => {
  const results = []
  for (let file of files) {
    const data = await readFile(file)
    results.push({
      ...file,
      data,
    })
  }
  return results
}

const readFile = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', event => {
      resolve(event.target.result)
    })
    reader.addEventListener('error', error => {
      console.error('FileReader error', error)
      reject(error)
    })
    reader.readAsDataURL(file)
  })

// TODO: リファクタリング
const createImage = async files => {
  await loadImages(files)

  const size = {
    horizontal: {
      width: 0,
      height: 0,
    },
    vertical: {
      width: 0,
      height: 0,
    },
  }
  files.forEach(file => {
    const width = Math.round(file.image.width * config.scale)
    if (size.vertical.width < width) {
      size.vertical.width = width
    }
    size.horizontal.width += width
    const height = Math.round(file.image.height * config.scale)
    if (size.horizontal.height < height) {
      size.horizontal.height = height
    }
    size.vertical.height += height
  })
  size.vertical.width += config.margin * 2
  size.horizontal.height += config.margin * 2
  size.horizontal.width += config.margin * (files.length + 1)
  size.vertical.height += config.margin * (files.length + 1)

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = size.horizontal.width
  canvas.height = size.horizontal.height
  let x = config.margin
  files.forEach((file, index) => {
    const y = config.margin
    const width = Math.round(file.image.width * config.scale)
    const height = Math.round(file.image.height * config.scale)
    context.drawImage(file.image, x, y, width, height)
    x += width + config.margin
  })

  const $image = new Image()
  $image.src = canvas.toDataURL('image/png')

  const $a = document.createElement('a')
  $a.href = $image.src
  $a.target = '_blank'
  $a.appendChild($image)

  const container = document.querySelector('.js-output')
  container.innerHTML = ''
  container.appendChild($a)

}

const loadImages = async files => {
  for (let file of files) {
    const event = await loadImage(file.data)
    file.image = event.target
  }
}

const loadImage = src =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = resolve
    image.onerror = reject
    image.src = src
  })

main()
