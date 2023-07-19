## React中props中传递React Element的方式

### 一、为何需要在props中传递React Element

如何将React组件作为props进行传递

首先，假设我们需要封装一个带有icon的button组件，可以下面👇这种方式进行实现

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

若是需要提供指定不同类型icon的能力，可以通过传递iconName的形式来实现👇

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

若是需要提供指定icon组件的size、color等属性的能力，可以通过传递iconProps的形式来实现👇

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

但若是需要提供

