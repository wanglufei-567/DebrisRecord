### 挂载阶段

- #### **Parent constructor(props)**

  - 类的构造函数，也是组件初始化函数，一般情况下，
    - 可以拿到props
    - 初始化 state
    - 处理事件绑定函数的 this

- #### Parent static getDerivedStateFromProps(props, state)

  - 该方法会在 render 方法之前调用，无论是挂载阶段还是更新阶段
    - 静态方法，拿不到this属性(this是undefined)
    - 两个入参(props,state)是最新的props和state，比如当setState()执行时，这里拿到的就是更新后的state
    - 必须要返回一个对象(作为新的state，其实相当于执行了setState)或者 null（相当于没有任何操作）

- #### Parent render()

  - render 方法是 Class 组件必须实现的方法
    -  渲染函数，唯一的一定不能省略的函数，必须有返回值，返回null或false表示不渲染任何DOM元素。它是一个仅仅用于渲染的纯函数，返回值完全取决于this.state和this.props，不能在函数中任何修改props、state、拉取数据等具有副作用的操作。**<u>render函数返回的是JSX的对象，该函数并不因为这渲染到DOM树，何时进行真正的渲染是有React库决定的</u>**。（setState是一个异步函数）

- #### Children constructor(props)

- #### Children static getDerivedStateFromProps(props, state)

- #### Children render()

- #### Children componentDidMount()

- #### Parent componentDidMount()

  - 挂载成功函数。该函数不会再render函数调用完成之后立即调用，因为render函数仅仅是返回了JSX的对象，并没有立即挂载到DOM树上，而<u>**componentDidMount是在组件被渲染到DOM树之后被调用的**</u>。另外，componentDidMount函数在进行服务器端渲染时不会被调用。

    通常在这个阶段，我们可以：

    - 操作 DOM 节点
    - 发送请求

### 更新阶段

- #### Parent static getDerivedStateFromProps(props, state)

- #### Parent shouldComponentUpdate(nextProps, nextState)

  - 发生在更新阶段，getDerivedStateFromProps 之后，render 之前，该函数会返回一个布尔值，决定了后续是否执行 render，首次渲染不会调用该函数
    - nextProps, nextState是更新后的props和state，getDerivedStateFromProps()函数return出来的state也是更新后的state，在这就是nextState
    - 此时，this上的props和state还是未更新的，所以在这可以比较nextProps和this.props，从而决定要不要return true(也就是进行更新)
    - return true之后，this.props,this.state就是新的了

- #### Parent render()

- #### Child static getDerivedStateFromProps(props, state)

- #### Child shouldComponentUpdate(nextProps, nextState)

- #### Child render()

- #### Child getSnapshotBeforeUpdate(prevProps, prevState)

- #### Child componentDidUpdate()

- #### Parent getSnapshotBeforeUpdate(prevProps, prevState)

  - 该方法在 render() 之后，但是在输出到 DOM 之前执行，用来获取渲染之前的快照。当我们想在当前一次更新前获取上次的 DOM 状态，可以在这里进行处理，该函数的返回值将作为参数传递给下个生命周期函数 componentDidUpdate
  - prevProps, prevState是更新前的props和state，此时的this.state,this.props已经是新的了
  - return 一个值，componentDidUpdate()中可以接收到作为第三个参数

- #### Parent componentDidUpdate(prevProps, prevState, snapshot)

  - 该方法在getSnapshotBeforeUpdate方法之后被调用，有三个参数prevProps，prevState，snapshot，表示之前的props，之前的state，和snapshot。第三个参数是getSnapshotBeforeUpdate返回的。

  - **<u>在 DOM 更新后立即调用</u>**，首次渲染不会调用该方法。在这个函数里我们可以操作DOM，和发起服务器请求，还可以setState，但是注意一定要用if语句控制，否则会导致无限循环

  - getSnapshotBeforeUpdate(prevProps, prevState)是在DOM更新前调用，

    而componentDidUpdate(prevProps, prevState, snapshot)在 DOM 更新后立即调用，所以这里可以依据props或state的改变对DOM进行改变

    

    

    #### PureComponent

    PureComponent实际上自动加载shouldComponentUpdate函数，当组件更新时，shouldComponentUpdate对props和state进行了一层浅比较

    
    
    
    
    // React设计理念是 跨平台渲染=>virtualDom 快速响应=>异步可中断+增量更新
    
    // 因为是异步可中断的了，所以可能导致componentWillMount()多次执行，所以这些生命周期要废弃
    
    


