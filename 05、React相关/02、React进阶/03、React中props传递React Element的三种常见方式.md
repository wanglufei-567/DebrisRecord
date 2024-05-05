## React中props传递React Element的三种常见方式

### 一、为何需要在props中传递React Element

如何将**React**组件作为`props`进行传递

首先，假设我们需要封装一个带有**icon**的**Button**组件，可以通过下面👇这种方式进行实现

```jsx
const Button = ({ children }: { children: ReactNode }) => {
  return (
    <button>
      <SomeIcon size="small" color="red" />
      {children}
    </button>
  );
};
```

若是需要提供能够指定不同类型**icon**的能力，可以通过传递**iconName**的形式来实现👇

```tsx
type Icons = 'cross' | 'warning' | ... // all the supported icons

const getIconFromName = (iconName: Icons) => {
  switch (iconName) {
    case 'cross':
      return <CrossIcon size="small" color="red" />;
    ...
    // all other supported icons
  }
}
const Button = ({ children, iconName }: { children: ReactNode, iconName: Icons }) => {
  const icon = getIconFromName(iconName);

  return (
  <button>
    {icon}
    {children}
  </button>
  )
}
```

若是需要提供能够指定**icon**的`size`、`color`等属性的能力，可以通过传递**iconProps**的形式来实现👇

```tsx
type Icons = 'cross' | 'warning' | ... // all the supported icons
type IconProps = {
  size: 'small' | 'medium' | 'large',
  color: string
};
const getIconFromName = (iconName: Icons, iconProps: IconProps) => {
  switch (iconName) {
    case 'cross':
      return <CrossIcon {...iconProps} />;
    ...
    // all other supported icons
  }
}
const Button = ({ children, iconName, iconProps }: { children: ReactNode, iconName: Icons, iconProps: IconProps }) => {
  const icon = getIconFromName(iconName, iconProps);

  return <button>
    {icon}
    {children}
  </button>
}
```

但若是需要能够指定**icon**组件在不同状态下响应事件的能力，比如**icon**组件在**hover**状态下的样式变化，那么便又要传递一个**onHover**的回调函数；或者需要提供给**icon**其他的能力，若是每次都通过**Button**组件的**props**传递给**icon**组件，不仅会使得整个**Button**组件变得臃肿，而且其内部的**icon**组件也变得十分定制化，==不具备通用型==；

每次需要拓展**icon**能力时，都去修改**Button**组件的定义，这种方式显然是不明智的，我们应当==关注**Button**组件本身的逻辑==，不需要关注其内部**icon**组件是怎么渲染的，具备什么能力；

利用**props**直接传递**icon**本身，则可以完美解决这个问题，==**Button**组件不用关注**icon**组件是什么样的，只需要将传入的**icon**组件渲染到指定的位置即可==

利用**props**传递一个组件，有三种比较常用的实现方式👇：

- 直接传递一个**React Element**
- 传递一个**Component**
- 传递一个**render**方法

### 二、三种方式的具体使用

接下来还是以上述带有**icon**的**Button**组件为例，说明这三种方式是如何使用的

- **icon作为一个React Element**

  **Button**组件可以按照下面👇这样进行分装，直接传递**icon**，然后将其在指定的地方直接进行渲染

  ```tsx
  type ButtonProps = {
    children: ReactNode;
    icon: ReactElement<IconProps>;
  };
  
  export const ButtonWithIconElement = ({ children, icon }: ButtonProps) => {
    return (
      <button>
        // our icon, same as children, is just React element
        // which we can add directly to the render function
        {icon}
        {children}
      </button>
    );
  };
  ```

  **Button**组件在使用时，直接将**icon**（<AccessAlarmIconGoogle />）通过**props**进行传递

  ```tsx
  <ButtonWithIconElement 
    icon={<AccessAlarmIconGoogle fontSize="small" color="warning" />}
  >
    button here
  </ButtonWithIconElement>
  ```

- **icon**作为一个**Component**

  与第一种方式不同的是，这里的**icon**是一个组件的形式，而不是一个**JSX**语法形式的**React Element**，然后在指定的地方通过**JSX**语法完成渲染 <!--这种方式类似于我们直接import一个组件的使用方式-->

  ```tsx
  type ButtonProps = {
    children: ReactNode;
    Icon: ComponentType<IconProps>;
  };
  
  export const ButtonWithIconComponent = ({ children, Icon }: ButtonProps) => {
    return (
      <button>
        // our button is a component
        // its name starts with a capital letter to signal that
        // so we can just render it here as any other component
        <Icon />
        {children}
      </button>
    );
  };
  ```

  **Button**组件在使用时，直接将**icon**（**AccessAlarmIcon**）通过**props**进行传递

  ```tsx
  import AccessAlarmIconGoogle from '@mui/icons-material/AccessAlarm';
  const AccessAlarmIcon = () => <AccessAlarmIconGoogle fontSize="small" color="error" />;
  
  <ButtonWithIconComponent Icon={AccessAlarmIcon}>button here</ButtonWithIconComponent>;
  ```

  这里的**props** `icon`其实只是组件**AccessAlarmIcon**的引用，最终的渲染还是要通过**JSX**的语法在组件内部完成

  <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/mental-circle-with-props-example-20230812221020615.png" alt="img" style="zoom:50%;" />

- **icon**作为一个**render**方法

  这种方式是我们平常最常见的一种方式，传递的是一个返回**icon**的**render**方法，然后在指定的地方直接进行渲染

  ```tsx
  type ButtonProps = {
    children: ReactNode;
    renderIcon: () => ReactElement<IconProps>;
  };
  
  export const ButtonWithIconRenderFunc = ({ children, renderIcon }: ButtonProps) => {
    // getting the Element from the function
    const icon = renderIcon();
    return (
      <button>
        // adding element like any other element here
        {icon}
        {children}
      </button>
    );
  };
  ```

  **Button**组件在使用时，将**render**方法（**renderIcon**）通过**props**进行传递

  ```tsx
  <ButtonWithIconRenderFunc 
    renderIcon={() => (
      <AccessAlarmIconGoogle fontSize="small" color="success" />
    )}
  >
    button here
  </ButtonWithIconRenderFunc>
  ```

### 三、Icon组件与Button组件的交互

以上三种方式的使用中传递的**Icon**组件都是独立的一个组件，没有与**Button**组件有任何的交互，**Button**组件只是将**Icon**组件渲染在指定的位置上；

但假设有这样一种场景，当**hover**在**Button**组件上时需要改变**Icon**组件的样式，比如颜色、大小，这个时候就需要**Icon**组件能够拿到**Button**组件的状态，那以上的三种方式如何能够满足这样的需求？

看下面👇

首先，改造下**Button**组件，用一个**state**保存**hover**状态

```js
export const ButtonWithIcon = (...) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
    >
      ...
    </button>
  );
};
```

接下来看下三种方式是如何满足这个需求的

- **icon作为一个React Element**

  这种方式需要使用到一个**React**的**API**方法**cloneElement**

  > `React.cloneElement` 是 React 库中的一个方法，用于克隆并返回一个给定的 **React** 元素，同时可以附加新的属性或覆盖现有的属性
  >
  > ```jsx
  > React.cloneElement(element, [props], [...children])
  > ```
  >
  > - `element`: 要克隆的 React 元素
  > - `props` (可选): 一个包含新属性的对象，用于替换或扩展原始元素的属性
  > - `children` (可选): 新的子元素。如果未提供这个参数，原始元素的子元素将被保留
  >
  > ==`React.cloneElement` 的作用是在不更改原始元素的情况下，创建一个具有新属性或子元素的副本==

  ```jsx
  type ButtonProps = {
    children: ReactNode;
    icon: ReactElement<IconProps>;
  };
  
  export const ButtonWithIconElement = ({ children, icon }: ButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const clonedIcon = React.cloneElement(icon, {
      fontSize: icon.props.fontSize || 'small',
      isHovered: isHovered,
    });
    
    return (
      <button
        onMouseOver={() => setIsHovered(true)}
        onMouseOut={() => setIsHovered(false)}
      >
        {clonedIcon}
        {children}
      </button>
    );
  };
  ```

  这样**Icon**组件便可以直接拿到**Button**内部的状态了

  ```js
  const AlarmIconWithHoverForElement = (props) => {
    return (
      <AccessAlarmIconGoogle
        // don't forget to spread all the props!
        // otherwise you'll lose all the defaults the button is setting
        {...props}
        // and just override the color based on the value of `isHover`
        color={props.isHovered ? 'primary' : 'warning'}
      />
    );
  };
  ```

- **icon**作为一个**Component**

  相比较第一种方式，这种方式就简单很多了，由于通过**props**传递进来的只是**Icon**组件的引用，那么只需在使用时直接传递即可

  ```jsx
  type ButtonProps = {
    children: ReactNode;
    Icon: ComponentType<IconProps>;
  };
  
  export const ButtonWithIconComponent = ({ children, Icon }: ButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <button
        onMouseOver={() => setIsHovered(true)}
        onMouseOut={() => setIsHovered(false)}
      >
        <Icon isHovered={isHovered}/>
        {children}
      </button>
    );
  };
  ```

- **icon**作为一个**render**方法

  这种方式与第二种方式的解决方法很类似，直接传递即可

  ```jsx
  type ButtonProps = {
    children: ReactNode;
    renderIcon: () => ReactElement<IconProps>;
  };
  
  export const ButtonWithIconRenderFunc = ({ children, renderIcon }: ButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const icon = renderIcon({
      fontSize: 'small',
      isHovered: isHovered,
    });
    return (
      <button>
        // adding element like any other element here
        {icon}
        {children}
      </button>
    );
  };
  ```

  ```jsx
  <ButtonWithIconRenderFunc
    renderIcon={(settings) => (
      <AccessAlarmIconGoogle
        fontSize={settings.fontSize}
        color={settings.isHovered ? "primary" : "warning"}
      />
    )}
  >
  ```

### 四、总结

这三种方式或多或少都有些像是之处，每一种方式基本上能满足99%使用场景，若一定要说这三种方式的适用场景，那就是👇

- 作为一个**React Element**进行传递
  - 适用于只需要渲染在指定的地方，而不用在接收的地方对组件的`props`进行调整的场景
- 作为一个**Component**进行传递
- 作为一个**render**方法进行传递
  - 适用于依赖接收处状态值，对组件内部的实现结果进行调整的场景







