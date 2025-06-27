## JavaScript 沙盒环境安全防护策略深度解析

### 一、前言

在现代 **Web** 应用中，允许用户执行自定义 **JavaScript** 代码已成为许多平台的核心功能，如在线代码编辑器、低代码平台、用户脚本系统等。然而，这种灵活性也带来了巨大的安全风险。本文将深入分析一套完整的 JavaScript 沙盒安全防护策略，探讨如何在保证功能性的同时确保系统安全。

### 二、核心安全威胁分析

#### 2.1、代码注入攻击
恶意用户可能通过字符串拼接等方式注入恶意代码：

```javascript
// 危险示例：用户可控制的延时参数
const userConfig = {
    delay: "1000); eval(atob('YWxlcnQoJ2hhY2tlZCcp')); //"
}

// 不安全的代码拼接
setTimeout("processData()", userConfig.delay)
// 实际执行：setTimeout("processData()", 1000); eval(atob('YWxlcnQoJ2hhY2tlZCcp')); //")
```

#### 2.2、敏感信息窃取
通过访问 `document.cookie`、`localStorage` 等 API 窃取用户数据：

```javascript
// 恶意代码示例
document.cookie // 获取所有 Cookie
localStorage.getItem('sensitive_token') // 窃取本地存储
```

#### 2.3、跨框架攻击
通过 `window.parent` 等 API 逃逸沙盒环境，攻击父页面：

```javascript
// 尝试访问父窗口
window.parent.location = 'http://malicious-site.com'
window.top.document.cookie // 获取顶层页面的 Cookie
```

### 三、安全防护策略详解

#### 3.1、策略一：API 访问控制

##### 3.1.1 危险 API 黑名单机制

```javascript
const forbiddenAPIs = [
    "eval",           // 动态代码执行
    "cookie",         // Cookie 访问
    "localStorage",   // 本地存储
    "sessionStorage", // 会话存储
    "indexedDB",      // 数据库访问
    "parent"          // 父窗口访问
];

const secureWindow = new Proxy(window, {
    get: (target, property) => {
        if (forbiddenAPIs.includes(property)) {
            throw new Error(`${property} forbidden`);
        }
        const value = target[property];
        return typeof value === 'function' ? value.bind(target) : value;
    }
});
```

##### 3.1.2 Document 对象安全代理

```javascript
const secureDocument = new Proxy(document, {
    get: (target, property) => {
        // 特定属性访问控制
        if (["cookie"].includes(property)) {
            throw new Error(`${property} forbidden`);
        }
        const value = target[property];
        return typeof value === 'function' ? value.bind(target) : value;
    }
});
```

#### 3.2、策略二：定时器函数安全化

##### 3.2.1 问题根源分析

`setTimeout` 和 `setInterval` 支持字符串参数，这为代码注入提供了温床：

```javascript
// 危险：字符串会被当作代码执行
setTimeout("alert('XSS攻击!')", 1000);
setTimeout("document.location='http://evil.com'", 1000);

// 安全：只接受函数参数
setTimeout(() => alert('正常执行'), 1000);
```

##### 3.2.2 安全化实现

```javascript
const secureSetTimeout = function(callback, ...args) {
    if (typeof callback === "string") {
        throw new Error("setTimeout string forbidden");
    }
    return window.setTimeout(callback, ...args);
};

const secureSetInterval = function(callback, ...args) {
    if (typeof callback === "string") {
        throw new Error("setInterval string forbidden");
    }
    return window.setInterval(callback, ...args);
};
```

#### 3.3、策略三：沙盒环境构建

##### 3.3.1 立即执行函数表达式（IIFE）

使用 IIFE 创建独立的执行环境，避免全局命名空间污染：

```javascript
!function(document, window) {
    "use strict";
    // 用户代码在安全环境中执行
    ${sanitizedCode}
}(secureDocument, secureWindow);
```

**语法解析：**
- `!` 操作符将函数声明转换为函数表达式
- 立即执行，创建独立作用域
- 传入安全代理对象替代原生 API

##### 3.3.2 完整安全上下文实现

```javascript
export function addSecureExecutionContextForIframe(sanitizedCode: string) {
    return `!function(){
        // 安全化定时器
        const secureSetTimeout = function(n,...e){
            if("string"==typeof n) throw new Error("setTimeout string forbidden");
            return window.setTimeout(n,...e);
        };

        const secureSetInterval = function(n,...e){
            if("string"==typeof n) throw new Error("setInterval string forbidden");
            return window.setInterval(n,...e);
        };

        // Document 代理
        const secureDocument = new Proxy(document,{
            get:(n,e)=>{
                if(["cookie"].includes(e)) throw new Error(e+" forbidden");
                const t=n[e];
                return"function"==typeof t?t.bind(n):t;
            }
        });

        // Window 代理
        const forbiddenAPIs = ["eval","cookie","localStorage","sessionStorage","indexedDB","parent"];
        const secureWindow = new Proxy(window,{
            get:(o,i)=>{
                if(forbiddenAPIs.includes(i)) throw new Error(i+" forbidden");
                if("document"===i) return secureDocument;
                if("setTimeout"===i) return secureSetTimeout;
                if("setInterval"===i) return secureSetInterval;
                const f=o[i];
                return"function"==typeof f?f.bind(o):f;
            }
        });

        // 安全执行环境
        !function(document,window){
            "use strict";
            ${sanitizedCode}
        }(secureDocument,secureWindow);
    }();`;
}
```

##### 3.3.3 使用示例

```javascript
// 1. 基本使用场景
const userCode = `
    console.log('Hello from sandbox!');
    document.getElementById('output').textContent = 'Safe execution';
`;

const secureCode = addSecureExecutionContextForIframe(userCode);
console.log('生成的安全代码:', secureCode);

// 2. 在 iframe 中执行用户代码
function executeUserCodeSafely(userCode) {
    // 创建隔离的 iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // 生成安全执行上下文
    const secureCode = addSecureExecutionContextForIframe(userCode);

    // 在 iframe 中执行
    const iframeDoc = iframe.contentDocument;
    const script = iframeDoc.createElement('script');
    script.textContent = secureCode;
    iframeDoc.head.appendChild(script);

    // 清理
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 5000);
}

// 3. 在线代码编辑器集成示例
class SecureCodeEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.setupEditor();
    }

    setupEditor() {
        this.container.innerHTML = `
            <textarea id="code-input" placeholder="输入你的 JavaScript 代码..."></textarea>
            <button onclick="this.runCode()">安全执行</button>
            <div id="output"></div>
        `;
    }

    runCode() {
        const userCode = document.getElementById('code-input').value;
        try {
            executeUserCodeSafely(userCode);
        } catch (error) {
            document.getElementById('output').textContent = `错误: ${error.message}`;
        }
    }
}

// 使用编辑器
const editor = new SecureCodeEditor('editor-container');
```

### 四、防护效果验证

#### 4.1、测试环境搭建

首先，我们创建一个测试环境来验证安全防护策略的效果：

```javascript
// 测试工具函数
function testSecurityFeature(testName, maliciousCode, expectedError) {
    console.group(`🧪 测试: ${testName}`);

    try {
        // 使用安全上下文执行恶意代码
        const secureCode = addSecureExecutionContextForIframe(maliciousCode);

        // 在隔离环境中执行
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const script = iframe.contentDocument.createElement('script');
        script.textContent = secureCode;
        iframe.contentDocument.head.appendChild(script);

        console.log('❌ 测试失败: 恶意代码未被阻止');
        document.body.removeChild(iframe);

    } catch (error) {
        if (error.message.includes(expectedError)) {
            console.log(`✅ 测试通过: ${error.message}`);
        } else {
            console.log(`⚠️ 意外错误: ${error.message}`);
        }
    }

    console.groupEnd();
}
```

#### 4.2、测试用例一：代码注入防护

```javascript
// 测试 setTimeout 字符串注入
testSecurityFeature(
    'setTimeout 字符串代码注入',
    `setTimeout("eval('alert(\\"hacked\\")')", 1000);`,
    'setTimeout string forbidden'
);

// 测试 setInterval 字符串注入
testSecurityFeature(
    'setInterval 字符串代码注入',
    `setInterval("document.location='http://evil.com'", 1000);`,
    'setInterval string forbidden'
);

// 测试复杂的代码注入场景
testSecurityFeature(
    '复杂代码注入场景',
    `
    const userInput = "1000); eval(atob('YWxlcnQoJ2hhY2tlZCcp')); //";
    setTimeout("processData()", userInput);
    `,
    'setTimeout string forbidden'
);
```

#### 4.3、测试用例二：敏感信息访问防护

```javascript
// 测试 Cookie 访问
testSecurityFeature(
    'Cookie 访问防护',
    `
    try {
        const cookies = document.cookie;
        console.log('窃取到的 Cookie:', cookies);
    } catch (e) {
        throw e; // 重新抛出错误以便测试捕获
    }
    `,
    'cookie forbidden'
);

// 测试本地存储访问
testSecurityFeature(
    'localStorage 访问防护',
    `
    try {
        const token = localStorage.getItem('auth_token');
        console.log('窃取到的 token:', token);
    } catch (e) {
        throw e;
    }
    `,
    'localStorage forbidden'
);

// 测试 sessionStorage 访问
testSecurityFeature(
    'sessionStorage 访问防护',
    `
    try {
        sessionStorage.setItem('malicious', 'data');
    } catch (e) {
        throw e;
    }
    `,
    'sessionStorage forbidden'
);

// 测试 indexedDB 访问
testSecurityFeature(
    'indexedDB 访问防护',
    `
    try {
        const request = indexedDB.open('malicious_db');
    } catch (e) {
        throw e;
    }
    `,
    'indexedDB forbidden'
);
```

#### 4.4、测试用例三：跨框架攻击防护

```javascript
// 测试父窗口访问
testSecurityFeature(
    '父窗口访问防护',
    `
    try {
        window.parent.location.href = 'http://malicious-site.com';
    } catch (e) {
        throw e;
    }
    `,
    'parent forbidden'
);

// 测试 eval 函数访问
testSecurityFeature(
    'eval 函数防护',
    `
    try {
        eval('alert("direct eval attack")');
    } catch (e) {
        throw e;
    }
    `,
    'eval forbidden'
);

// 测试间接 eval 访问
testSecurityFeature(
    '间接 eval 防护',
    `
    try {
        const indirectEval = window.eval;
        indirectEval('console.log("indirect eval attack")');
    } catch (e) {
        throw e;
    }
    `,
    'eval forbidden'
);
```

#### 4.5、测试用例四：正常功能验证

```javascript
// 验证正常的 JavaScript 功能仍然可用
function testNormalFunctionality() {
    console.group('🔧 正常功能测试');

    const normalCode = `
        // 正常的 DOM 操作
        const div = document.createElement('div');
        div.textContent = 'Normal operation works';

        // 正常的函数式 setTimeout
        setTimeout(function() {
            console.log('Normal setTimeout works');
        }, 100);

        // 正常的数学计算
        const result = Math.max(1, 2, 3);
        console.log('Math operations work:', result);

        // 正常的数组操作
        const arr = [1, 2, 3].map(x => x * 2);
        console.log('Array operations work:', arr);
    `;

    try {
        const secureCode = addSecureExecutionContextForIframe(normalCode);

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const script = iframe.contentDocument.createElement('script');
        script.textContent = secureCode;
        iframe.contentDocument.head.appendChild(script);

        console.log('✅ 正常功能测试通过');

        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);

    } catch (error) {
        console.log('❌ 正常功能测试失败:', error.message);
    }

    console.groupEnd();
}

// 执行正常功能测试
testNormalFunctionality();
```

#### 4.6、综合测试套件

```javascript
// 完整的测试套件
function runCompleteSecurityTests() {
    console.log('🚀 开始 JavaScript 沙盒安全测试');
    console.log('=====================================');

    // 代码注入测试
    console.log('📝 代码注入防护测试');
    testSecurityFeature('setTimeout 注入', 'setTimeout("alert(1)", 100)', 'setTimeout string forbidden');
    testSecurityFeature('setInterval 注入', 'setInterval("alert(1)", 100)', 'setInterval string forbidden');

    // 敏感信息访问测试
    console.log('\n🔒 敏感信息访问防护测试');
    testSecurityFeature('Cookie 访问', 'document.cookie', 'cookie forbidden');
    testSecurityFeature('localStorage 访问', 'localStorage.getItem("test")', 'localStorage forbidden');
    testSecurityFeature('sessionStorage 访问', 'sessionStorage.getItem("test")', 'sessionStorage forbidden');

    // 跨框架攻击测试
    console.log('\n🛡️ 跨框架攻击防护测试');
    testSecurityFeature('父窗口访问', 'window.parent.location', 'parent forbidden');
    testSecurityFeature('eval 访问', 'eval("1+1")', 'eval forbidden');

    // 正常功能测试
    console.log('\n✅ 正常功能验证测试');
    testNormalFunctionality();

    console.log('\n🎯 所有安全测试完成');
}

// 运行测试套件
runCompleteSecurityTests();
```

### 五、性能与兼容性考虑

#### 5.1、性能影响分析

1. **Proxy 开销**：每次属性访问都会触发代理拦截器
2. **类型检查开销**：定时器函数需要额外的类型验证
3. **内存占用**：创建多层代理对象增加内存使用

这些性能开销在大多数应用场景中是可以接受的，因为安全性的重要性远超过微小的性能损失。

### 六、实际应用场景

#### 6.1、在线代码编辑器
- **CodePen**、**JSFiddle** 等平台
- 用户可编写和执行 JavaScript 代码
- 需要防止恶意代码影响平台稳定性

#### 6.2、低代码平台
- 用户自定义业务逻辑脚本
- 表达式计算和数据处理
- 确保租户间代码隔离

#### 6.3、浏览器插件系统
- 第三方开发者提供的扩展功能
- 用户脚本（Userscript）执行
- 防止恶意插件窃取用户数据

### 七、进阶安全措施

#### 7.1、Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy"
      content="script-src 'self' 'unsafe-eval'; object-src 'none';">
```

#### 7.2、子资源完整性（SRI）

```html
<script src="user-script.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>
```

#### 7.3、网络请求限制

```javascript
// 拦截和过滤网络请求
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (!isAllowedDomain(url)) {
        throw new Error('Network request to unauthorized domain');
    }
    return originalFetch.call(this, url, options);
};
```

### 八、总结与展望

本文介绍的 JavaScript 沙盒安全防护策略通过多层防护机制，有效地解决了用户代码执行中的主要安全威胁：

#### 8.1、核心防护机制
1. **API 访问控制** - 通过 Proxy 代理限制危险 API 访问
2. **定时器安全化** - 禁止字符串形式的代码注入
3. **环境隔离** - 使用 IIFE 创建独立执行环境
4. **多层验证** - 结合类型检查、黑名单等多种验证手段

#### 8.2、适用场景
- 在线代码编辑器和教学平台
- 低代码/无代码开发平台
- 用户脚本和插件系统
- 动态表达式计算引擎

#### 8.3、未来发展方向
1. **WebAssembly 沙盒** - 利用 WASM 的天然隔离特性
2. **Worker 线程隔离** - 在独立线程中执行用户代码
3. **容器化执行** - 结合服务端容器技术提供更强隔离
4. **AI 辅助检测** - 使用机器学习识别潜在恶意代码模式

通过不断完善和发展这些安全防护策略，我们可以在享受 JavaScript 灵活性的同时，确保 Web 应用的安全性和稳定性。安全永远是一个持续演进的过程，需要开发者保持警惕，及时更新防护措施以应对新的安全威胁。

```
