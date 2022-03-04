### 前言

WebView是ReactNative中的组件 , 它可以创建一个原生的WebView，可以用于访问一个网页

下面👇这张页面效果图中红色部分就是WebView组件的部分，展示的便是一个html页面的内容

<div align="left">
<img src=https://dongger-typora.oss-cn-beijing.aliyuncs.com/typora/Screenshot_20220304_113627_com.xiaojukeji.vc.operator.debug.jpg  width=40% height=40%/>
</div>



##### RN和Web页面的通信主要通过WebView组件提供的以下三个方法进行

- React Native -> Web:  `injectedJavaScript` 属性
- React Native -> Web:  `injectJavaScript` 方法（this.refs.webviewr.injectJavaScript(...)）
- Web -> React Native:  `onMessage` 属性回调，  web调用`window.ReactNativeWebView.postMessage`

### Show code

#### React Native -> Web通信（`injectedJavaScript`）

`injectedJavaScript`向web页面中注入代码

为了方便调试使用的是直接传入html的模式，可以看到html本身没有`backgroundColor`的设置，但页面的表现却是`backgroundColor:red`,这是因为`WebView`组件上有个`props`  `injectedJavaScript`可以向web页面中注入js代码；

设置web页面的背景色

```js
 injectedJavaScript={`(${String(() => {
            window.document.body.style.backgroundColor = 'red';
          })})();`}
```



```js
        <WebView
          ref={this.setWebviewRef}
          source={{
            html: `<html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body>
              <p id="p_0">webView页面</p>
              <button id="click">查看window.ReactNativeWebView</button>
              <br/>
              <br/>
              <button id="check">查看window.ReactNativeWebView.value</button>
              <br/>
              <br/>
              <button id="inform">webView向RN通信</button>
              <br/>
              <br/>
              <button id="back">返回</button>
            </body>
            <script>
              function clickCallback() {
                const windowKeys = Object.keys(window.ReactNativeWebView);
                windowKeys.forEach((ele, key) => {
                  const p = document.createElement('p');
                  p.innerHTML = 'window.ReactNativeWebView上的属性：' + ele
                  document.querySelector(\`#p_0\`).appendChild(p)
                })
              }
              document.querySelector("#click").addEventListener('click', clickCallback)

              function checkCallback() {
                const valueKeys = Object.keys(JSON.parse(window.ReactNativeWebView.value));
                valueKeys.forEach((ele, key) => {
                  const p = document.createElement('p');
                  p.innerHTML = ele + ':' + JSON.parse(window.ReactNativeWebView.value)[ele]
                  document.querySelector(\`#p_0\`).appendChild(p)
                })
              }
              document.querySelector("#check").addEventListener('click', checkCallback)

              function inform() {
                window.ReactNativeWebView.postMessage(JSON.stringify({webViewValue: {info: 'WebView向RN通信'}}));
              }
              document.querySelector("#inform").addEventListener('click', inform)

              function back() {
                window.ReactNativeWebView.postMessage(JSON.stringify({closeWebViewController: true}));
              }
              document.querySelector("#back").addEventListener('click', back)
            </script>
          </html>`,
          }}
          injectedJavaScript={`(${String(() => {
            window.document.body.style.backgroundColor = 'red';
          })})();`}
        />
```



#### React Native -> Web通信（`injectJavaScript`）

`injectedJavaScript`和`injectJavaScript`的区别从名字就可以看出，`injectedJavaScript`是提前注入到web页面中的，而`injectJavaScript`则是在web页面加载完成以后再注入的，所以可以使用`injectJavaScript`实现RN和Web的即时通信



通过挂载到`WebView`上的`ref`来调用`injectJavaScript`方法

```js
          <BasicButtons
            group={[
              {
                label: 'RN向WebView通信',
                size: 'base',
                type: 'primary',
                onPress: () => {
                  this.webRef.injectJavaScript(
                    `(${String(() => {
                      const value = JSON.parse(window.ReactNativeWebView.value);
                      value.info = ' RN向WebView通信';
                      window.ReactNativeWebView.value = JSON.stringify(value);
                    })})();`
                  );
                },
              },
            ]}
          />
```

#### 实现效果

可以看到RN侧传递的信息成功挂载到了web页面的windows.ReactNativeWebView.value属性上

<div align="left">
<img src=https://dongger-typora.oss-cn-beijing.aliyuncs.com/typora/Screenshot_20220304_133832_com.xiaojukeji.vc.operator.debug.jpg width=40% height=40%/>
</div>



#### Web -> React Native通信（`onMessage`）

在`WebView`组件上设置`onMessage`时，会在`web`页面上的`windows`上设置`window.ReactNativeWebView.postMessage`方法，`web`页面上调用`postMessage`方法会将参数传递到RN侧的`onMessage`的监听函数中

```jsx
  // web侧的代码
   function inform() {
                window.ReactNativeWebView.postMessage(JSON.stringify({webViewValue: {info: 'WebView向RN通信'}}));
              }


// RN侧的代码
onMessage = (e) => {
    try {
      const obj = JSON.parse(e.nativeEvent.data);
      if (obj.webViewValue) {
        this.setState({webViewValue: {...this.state.webViewValue, ...obj.webViewValue}});
      }
    } catch (msgErr) {}
  };


// .......
        <View style={{ width: '50%', margin: 10, height: '30%' }}>
          <Text style={{ fontSize: 17, margin: 5, color: '#000' }}>
            RN 页面
          </Text>
          <BasicButtons
            group={[
              {
                label: 'RN向WebView通信',
                size: 'base',
                type: 'primary',
                onPress: () => {
                  this.webRef.injectJavaScript(
                    `(${String(() => {
                      const value = JSON.parse(window.ReactNativeWebView.value);
                      value.info = ' RN向WebView通信';
                      window.ReactNativeWebView.value = JSON.stringify(value);
                    })})();`
                  );
                },
              },
            ]}
          />
          {Object.keys(this.state.webViewValue).map((item, key) => (
            <Text key={key} style={{ fontSize: 17, margin: 5, color: '#000' }}>
              {`${item}: ${this.state.webViewValue[item]}`}
            </Text>
          ))}
        </View>
// .....

```

### 实现效果

可以看到web侧传递的信息成功被RN侧接收到

<div align="left">
<img src=https://dongger-typora.oss-cn-beijing.aliyuncs.com/typora/Screenshot_20220304_134845_com.xiaojukeji.vc.operator.debug.jpg width=40% height=40%/>
</div>



#### 完整代码

```jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import BasicButtons from 'jimu/widget/button/BasicButtons';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    elevation: 3,
  },
  header: {
    position: 'relative',
    backgroundColor: '#FFF',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: StyleSheet.hairlineWidth,
    shadowOffset: {
      height: StyleSheet.hairlineWidth,
    },
    elevation: 4,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    paddingRight: 10,
    color: '#000',
  },
});

class WebviewScreen extends React.Component {
  state = {
    webViewValue: {},
  };

  injectedJavaScriptStr = `(${String(() => {
    window.document.body.style.backgroundColor = 'red';
  })})();`;

  onMessage = (e) => {
    try {
      const obj = JSON.parse(e.nativeEvent.data);
      if (obj.webViewValue) {
        this.setState({webViewValue: {...this.state.webViewValue, ...obj.webViewValue}});
      }
    } catch (msgErr) {
      //
    }
  };

  setWebviewRef = (ref) => {
    if (ref) {
      this.webRef = ref;
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{'webView页面'}</Text>
        </View>
        <View style={{ width: '60%', margin: 10, height: '30%' }}>
          <Text style={{ fontSize: 17, margin: 5, color: '#000' }}>
            RN 页面
          </Text>
          <BasicButtons
            group={[
              {
                label: 'RN向WebView通信',
                size: 'base',
                type: 'primary',
                onPress: () => {
                  this.webRef.injectJavaScript(
                    `(${String(() => {
                      const value = JSON.parse(window.ReactNativeWebView.value);
                      value.info = ' RN向WebView通信';
                      window.ReactNativeWebView.value = JSON.stringify(value);
                    })})();`
                  );
                },
              },
            ]}
          />
          {Object.keys(this.state.webViewValue).map((item, key) => (
            <Text key={key} style={{ fontSize: 17, margin: 5, color: '#000' }}>
              {`${item}: ${this.state.webViewValue[item]}`}
            </Text>
          ))}
        </View>

        <WebView
          ref={this.setWebviewRef}
          source={{
            html: `<html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body>
              <p id="p_0">webView页面</p>
              <button id="click">查看window.ReactNativeWebView</button>
              <br/>
              <br/>
              <button id="check">查看window.ReactNativeWebView.value</button>
              <br/>
              <br/>
              <button id="inform">webView向RN通信</button>
              <br/>
              <br/>
              <button id="back">返回</button>
            </body>
            <script>
              function clickCallback() {
                const windowKeys = Object.keys(window.ReactNativeWebView);
                windowKeys.forEach((ele, key) => {
                  const p = document.createElement('p');
                  p.innerHTML = 'window.ReactNativeWebView上的属性：' + ele
                  document.querySelector(\`#p_0\`).appendChild(p)
                })
              }
              document.querySelector("#click").addEventListener('click', clickCallback)

              function checkCallback() {
                const valueKeys = Object.keys(JSON.parse(window.ReactNativeWebView.value));
                valueKeys.forEach((ele, key) => {
                  const p = document.createElement('p');
                  p.innerHTML = ele + ':' + JSON.parse(window.ReactNativeWebView.value)[ele]
                  document.querySelector(\`#p_0\`).appendChild(p)
                })
              }
              document.querySelector("#check").addEventListener('click', checkCallback)

              function inform() {
                window.ReactNativeWebView.postMessage(JSON.stringify({webViewValue: {info: 'WebView向RN通信'}}));
              }
              document.querySelector("#inform").addEventListener('click', inform)

              function back() {
                window.ReactNativeWebView.postMessage(JSON.stringify({closeWebViewController: true}));
              }
              document.querySelector("#back").addEventListener('click', back)
            </script>
          </html>`,
          }}
          onMessage={this.onMessage}
          injectedJavaScript={this.injectedJavaScriptStr}
        />
      </View>
    );
  }
}

export default WebviewScreen;

```


