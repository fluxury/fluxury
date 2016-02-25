import CounterStore from './CounterStore'
import TodosStore from './TodosStore'

import {dispatch} from '../index'

console.log(CounterStore.getState())

dispatch('increment')
console.log(CounterStore.getState())

dispatch('increment')
console.log(CounterStore.getState())

dispatch('decrement')
console.log(CounterStore.getState())

console.log(TodosStore.getState())

dispatch('setTodo', { id: 0, desc: 'Do important thing' })
dispatch('setTodo', { id: 1, desc: 'Do important thing #2' })

console.log(TodosStore.getState())

dispatch('markDone', 0)
console.log(TodosStore.getState())

dispatch('trashTodo', 0)
console.log(TodosStore.getState())
