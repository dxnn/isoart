// RENDERER

function draw_memory(arr) {
  var nick = 'memory'
  var hoff = 500
  var voff = 0
  var wrap = 16
  var width = 30
  var height = 30
  
  for(var i = 0; i < arr.length; i++) {
    var x = width * (i % wrap) + hoff
    var y = height * (Math.floor(i/wrap)) + voff
    var color = arr[i]
    draw(color, x, y, i + nick)
  }
}

function draw_codes(arr) {
  var nick = 'codes'
  var hoff = 0
  var voff = 0
  var wrap = 16
  var width = 30
  var height = 30
  
  for(var i = 0; i < arr.length; i++) {
    var x = width * (i % wrap) + hoff
    var y = height * (Math.floor(i/wrap)) + voff
    var color = arr[i]
    draw(color, x, y, i + nick)
  }
}

function draw_highlight(pc) {
  var hoff = -10
  var voff = -10
  var wrap = 16
  var width = 30
  var height = 30
  var x = width * (pc % wrap) + hoff
  var y = height * (Math.floor(pc/wrap)) + voff
  
  draw(0, x, y, 'highlight')
}

function draw_saturation(pc, flag) {
  var nick = 'codes'
  var hoff = 0
  var voff = 0
  var wrap = 16
  var width = 30
  var height = 30
  
  var x = width * (pc % wrap) + hoff
  var y = height * (Math.floor(pc/wrap)) + voff
  var name = pc + nick
  
  var cell = vdom[name]
  if(!cell) return false
  
  color = cell.color
  draw(color, x, y, name, flag)
}

function draw_stacks() {
  el_stack.innerText = 'Stack (' + stack.length + '): ' + stack.slice(-40)
  el_rstack.innerText = 'Return stack: ' + rstack.map(function(item) {return item[1]})
}

function draw(color, x, y, name, sat_flag) {
  var base_sat = 40
  var full_sat = 100
  var sat = sat_flag ? full_sat : base_sat
  var lit = 70
  
  var cell = vdom[name]
  
  if(!cell) {
    cell = {x: 'asdf', y: 'asdf', color: 'asdf', sat_flag: sat_flag}
    cell.el = document.createElement("div")
    cell.el.classList.add('box')
    document.body.insertBefore(cell.el, bottom)
    vdom[name] = cell
  }
  
  if(cell.x != x) {
    cell.x = x
    cell.el.style.left = '' + x + 'px'
  }
  
  if(cell.y != y) {
    cell.y = y
    cell.el.style.top = '' + y + 'px'
  }
  
  if(cell.color != color || cell.sat_flag != sat_flag) {
    var webcolor
    cell.color = color
    var word = code_to_word(color)

    if(word) {
      var code = word_to_code(word)
      webcolor = 'hsl('+ (code * 13) +', '+ sat +'%, '+ lit +'%)'
    }
    else {
      webcolor = 'hsl(0, 0%, ' + Math.floor((sat_flag ? 70 : 40) + ((color*13) % 40)) + '%)'
    }
    
    cell.el.style.backgroundColor = webcolor
  }
}

