```
import { createStore } from 'redux';

function reducer(state = {name: 'redux'}, action) {
  console.log('action', action);
  switch (action.type) {
    case 'EDIT':
      return {
        value: action.value, // dispatch({type: 'EDIT', value: 123})
        ...state,
      };
    default:
      return state;
  }
}
const store = createStore(reducer);
console.log('store', store)
console.log('初始state', store.getState())
store.dispatch({
  type: 'EDIT',
  value: 'dispatch传的值'
}) // dispatch默认是同步修改
console.log('dispatch修改后的state', store.getState())


export default store;

```

**Redux中的核心概念**

- **store**  （ 是个对象，统一管理和维护state，Reducer，action ）
  - **reducer** （纯函数，决定了actions的变化如何更新state， actions 只是描述了**<u>有事情发生了</u>**这一事实，并没有描述如何更新 state。）
    - **state** (是个对象，存储数据的地方)
    - **action**（是个对象，将数据传入store中，这里需要注意的是，我们不直接去调用 Reducer 函数，而是通过 Store 对象提供的 dispatch 方法来将action传入Reducer）

**store上的方法**

- getState() 
  - 获取当前 store 存储 state
- dispatch(action)
  - 修改 state
- subscribe(listener)
  - 监听 state 发生修改
- replaceReducer(nextReducer)
  - 替换掉原来的 reducer

## redux 三大原则

- 单一数据源: 整个应用的 state 被储存在一棵 object tree 中，并且这个 object tree 只存在于唯一一个 store 中
- State 是只读的: 唯一改变 state 的方法就是触发 action，action 是一个用于描述已发生事件的普通对象
- 使用纯函数来执行修改