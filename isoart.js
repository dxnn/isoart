
/*

  This is all imperative and mutating and global and awful,
  but it was also written at a hack day so don't judge too harshly. ^_^

*/


var  stack  = []                                      // parameter stack
var rstack  = []                                      // return stack
var memory  = []                                      // TODO: make this a byte array

var codes   = []                                      // TODO: make this a byte array
var pc      = -1                                      // program counter
var vdom    = {}                                      // virtual dom

var bottom  = document.getElementById('bottom')       // divs are appended above this
var highlight = document.getElementById('pc')         // divs are appended above this
vdom['highlight'] = {el: highlight, color: 0}

var el_stack = document.getElementById('stack')       // divs are appended above this
var el_rstack = document.getElementById('rstack')     // divs are appended above this


var magic_offset = 16
var magic_switch = true

function reset() {
  pc = -1
  stack  = []
  rstack = []
  memory = resize(memory, 256)
}

function run(program) {
  reset()
  codes = compile(program) // OPT
  while(step(pc++) !== false) {}
}

function slowrun(program, done) {
  reset()
  codes = compile(program) // OPT
  codes = resize(codes, 256)
  
  function loop() {
    draw_memory(memory)
    draw_codes(codes)
    draw_highlight(pc)
    draw_saturation(pc, true)
    draw_stacks()
    
    if(step(pc++) !== false)
      window.requestAnimationFrame(loop)
    else
      if(typeof done == 'function') done()
  }
  window.requestAnimationFrame(loop)
}

function funrun() {
  hack_dict()
  rando(function looper() {
    if(!magic_switch) return
    var numdiffs = count_diffs(memory, program)

    if(Math.floor(Math.random() * numdiffs)) // hack to avoid getting stuck in boring cycles
      slowrun(memory, looper)
    else
      rando(looper)
  })
}

function rando(done) {
  memory  = randfill(256)
  program = clone(memory)
  slowrun(program, done)
}

function clone(arr) {
  return JSON.parse(JSON.stringify(arr))
}

function count_diffs(a1, a2) {
  var arr = zip(a1, a2)
  return arr.reduce(function(acc, pair) {return acc + (pair[0] !== pair[1])}, 0)
}

function zip(a1, a2) {
  return a1.map(function(x, i) {return [x, a2[i]]}) // happy path only
}

function hack_dict() {
  dict['>M1'] = dict['>M']
  dict['>M2'] = dict['>M']
  dict['>M3'] = dict['>M']
  dict['>M4'] = dict['>M']
  dict['>M5'] = dict['>M']
  dict['>M6'] = dict['>M']
  dict['>M7'] = dict['>M']
  dict['>M8'] = dict['>M']
  dict['>M9'] = dict['>M']

  dict['jump1'] = dict['jump']
  dict['jump2'] = dict['jump']
  
  var old_exit = dict['exit']
  dict['exit'] = function() {
    var out = old_exit()
    // dehighlight all the way back to new pc
    for(var i = codes.length - 1; i >= pc; i--) {
      draw_saturation(i, false)
    }
    return out
  }
  
  old_write = write
  write = function(addr, val) {
    old_write(addr, val)
    // preserve memory model
  }
}

function randfill(size) {
  var arr = []
  for(var i = 0; i < size; i++)
    arr.push(Math.floor(Math.random()*256))
  return arr
}

function step() {
  var code = codes[pc]
  if(code == null) return false
  var maybe_word = code_to_word(code)
  if(maybe_word)
    return dict[maybe_word]()
  else
    push(code)
}

function scan_to_sub(how_far) {
  // TODO: do it more if needed
  //  % 4 // NOTE: 4 is magic
  var addr = next_exit(pc)
  if(!addr) return false                              // cause 0 addr would be silly
  return addr
}

function next_exit(offset) {
  for(var i = offset+1; i < codes.length; i++)        // +1 for luck
    if(code_to_word(codes[i]) == 'exit')
      return i
}

function push(val) {
  stack.push( +val || 0 )
}

function pop() {
  return stack.pop()
}

function read(addr) {
  return memory[addr] | 0
}

function write(addr, val) {
  if(addr < 0) addr = 0
  if(addr >= memory.length) addr = memory.length - 1
  memory[addr] = (val | 0) % 255 // memory values are constrained
}

function resize(arr, size) {
  if(arr.length > size) 
    return arr.slice(0, size)
  
  arr = arr.slice()
  for(var i = arr.length; i < size; i++)
    arr.push(0)

  return arr
}

// COMPILER

function word_to_code(word) {
  var dict_keys = Object.keys(dict)
  var index = dict_keys.indexOf(word)
  if(index == -1) return false
  return index
}

function code_to_word(code) {
  var dict_keys = Object.keys(dict)
  var numkeys = dict_keys.length
  var size = magic_offset + numkeys
  var index = (code % size) - magic_offset
  if(index < 0) return false
  return dict_keys[index]
}

function compile(program) {
  return program.map(function(word) {
    if(word == +word) return +word
    var maybe_code = word_to_code(word)
    if(maybe_code === false) return 0
    return maybe_code + magic_offset
  })
}

function decompile(bytecode) {
  return bytecode.map(function(code) {
    var maybe_word = code_to_word(code)
    if(maybe_word === false) return code
    return maybe_word
  })
}




// DICTIONARY

var dict = {}
dict['+']    = function() {var x = pop(); push((pop() + x) | 0)}
dict['-']    = function() {var x = pop(); push((pop() - x) | 0)}
dict['*']    = function() {var x = pop(); push((pop() * x) | 0)}
dict['/']    = function() {var x = pop(); push((pop() / x) | 0)}

dict['abs' ] = function() {push(Math.abs(pop()))}
dict['max' ] = function() {push(Math.max(pop(), pop()))}
dict['min' ] = function() {push(Math.min(pop(), pop()))}

dict['drop'] = function() {pop()}
dict['pick'] = function() {var p=pop(); push(stack[stack.length-p-1])}
dict['roll'] = function() {var p=pop(); var x=stack[stack.length-p-1]; stack.splice(stack.length-p-1, 1); push(x)}
dict['dup']  = function() {push(stack[stack.length-1])}

dict['>M']   = function() {var addr = pop(); var value = pop(); write(addr, value)}
dict['M>']   = function() {var addr = pop(); push(read(addr))}

dict['jump'] = function() {
  var index = pop()
  var how_far = pop()
  
  var addr = scan_to_sub(how_far)
  if(!addr) return dict['exit']()                     // YOLO
  
  // index = index % 2 // 2 is more fun
  
  var triple = [pc||0, index||0, addr||0]             // ugh NaNs whyyyyyyyy?
  rstack.push(triple)
  push(index)
  
  pc = addr
} 

dict['exit'] = function() {
  if(!rstack.length) return false                     // stop execution
  
  var triple = rstack.pop()
  var return_addr   = triple[0] || 0                  // NaNNaNNaNNaNNaNNaN
  var current_index = triple[1] || 0                  // NaNNaNNaNNaNNaNNaN
  var self_addr     = triple[2] || 0                  // BatNaN
    
  if(current_index < 1) { // THINK: -1 ?
    pc = return_addr                                  // all done!
  } else {
    current_index--
    push(current_index)
    rstack.push([return_addr, current_index, self_addr])
    pc = self_addr
  }
}








