**停止mongodb**

```
use admin;

db.shutdownServer();

```

用户管理员用户名和密码

```
use admin;

db.createUser({
  user: "root", 
  pwd: "123456", 
  roles: [
   {
    role: "root", 
    db:"admin"
   }
  ]
 } 
)

```


