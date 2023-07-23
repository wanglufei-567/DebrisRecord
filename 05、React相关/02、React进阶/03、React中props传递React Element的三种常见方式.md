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

  return <button>
    {icon}
    {children}
  </button>
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

但若是需要提供能够指定**icon**组件在不同状态下响应事件的能力，比如在**hover**状态下的样式变化，那么便又要传递一个**onHover**的回调函数；或者需要提供给**icon**其他的能力，若是每次都通过**Button**组件的**props**传递给**icon**组件，不仅会使得整个**Button**组件变得臃肿，而且其内部的**icon**组件也变得十分定制化，==不具备通用型==；

每次需要拓展**icon**能力时，都去修改**Button**组件的定义，这种方式显然是不明智的，我们应当==关注**Button**组件本身的逻辑==，不需要关注其内部**icon**组件是怎么渲染的，具备什么能力；

利用**props**传递**icon**组件（**React Element**），则可以完美解决这个问题，==**Button**组件不用关注**icon**组件是什么样的，只需要将传入的**icon**组件渲染到指定的位置即可==

利用**props**传递**React Element**，有三种比较常用的实现方式👇：

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

  



